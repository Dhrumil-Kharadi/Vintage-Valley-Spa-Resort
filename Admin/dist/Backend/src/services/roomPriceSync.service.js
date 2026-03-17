"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomPriceSyncService = void 0;
const client_1 = require("@prisma/client");
const ezeeLivePrice_service_1 = require("./ezeeLivePrice.service");
const errorHandler_1 = require("../middlewares/errorHandler");
const prisma = new client_1.PrismaClient();
exports.roomPriceSyncService = {
    /**
     * Sync eZee API prices to database rooms table
     * Matches rooms by title similarity and updates prices
     */
    async syncPricesToDatabase() {
        try {
            // Fetch live prices from eZee
            const liveRooms = await ezeeLivePrice_service_1.ezeeLivePriceService.fetchLivePrices({
                checkIn: getTodayDate(),
                checkOut: getTomorrowDate(),
                adults: 2,
                children: 0,
                rooms: 1,
            });
            // Get all rooms from database
            const dbRooms = await prisma.room.findMany({
                include: {
                    images: true,
                    amenities: true,
                },
            });
            const updates = [];
            for (const liveRoom of liveRooms) {
                // Find matching room in database by title similarity
                const matchingRoom = dbRooms.find((dbRoom) => dbRoom.title.toLowerCase().includes(liveRoom.Room_Name.toLowerCase()) ||
                    liveRoom.Room_Name.toLowerCase().includes(dbRoom.title.toLowerCase()));
                if (matchingRoom) {
                    const priceChanged = matchingRoom.pricePerNight !== liveRoom.avg_price_per_night;
                    const currentAvailability = Number(matchingRoom.availableRooms ?? 0);
                    const availabilityChanged = currentAvailability !== liveRoom.available_rooms;
                    // IMPORTANT: EP/CP/MAP values are managed by Admin (meal-based plans).
                    // This sync only updates base price + availability from eZee.
                    const newEpPrice = matchingRoom.epPricePerNight;
                    const newCpPrice = matchingRoom.cpPricePerNight;
                    const newMapPrice = matchingRoom.mapPricePerNight;
                    const updateData = {
                        roomId: matchingRoom.id,
                        title: matchingRoom.title,
                        oldPricePerNight: matchingRoom.pricePerNight,
                        newPricePerNight: liveRoom.avg_price_per_night,
                        oldEpPrice: matchingRoom.epPricePerNight,
                        newEpPrice: newEpPrice,
                        oldCpPrice: matchingRoom.cpPricePerNight,
                        newCpPrice: newCpPrice,
                        oldMapPrice: matchingRoom.mapPricePerNight,
                        newMapPrice: newMapPrice,
                        oldAvailability: currentAvailability,
                        newAvailability: liveRoom.available_rooms,
                    };
                    // Update room prices and availability in database
                    await prisma.room.update({
                        where: { id: matchingRoom.id },
                        data: {
                            pricePerNight: liveRoom.avg_price_per_night,
                            // Also update description if needed
                            description: liveRoom.Room_Description || matchingRoom.description,
                            ...(typeof liveRoom.available_rooms === "number"
                                ? { availableRooms: liveRoom.available_rooms }
                                : {}),
                        },
                    });
                    updates.push(updateData);
                    if (priceChanged || availabilityChanged) {
                        console.log(`Updated room: ${matchingRoom.title}`);
                        if (priceChanged) {
                            console.log(`  Base: ${matchingRoom.pricePerNight} → ${liveRoom.avg_price_per_night}`);
                        }
                        if (availabilityChanged) {
                            console.log(`  Availability: ${currentAvailability} → ${liveRoom.available_rooms}`);
                        }
                    }
                }
                else {
                    console.warn(`No matching room found in database for: ${liveRoom.Room_Name}`);
                }
            }
            return updates;
        }
        catch (error) {
            console.error("Failed to sync prices to database:", error);
            throw new errorHandler_1.HttpError(500, "Failed to sync prices to database");
        }
    },
    /**
     * Get current prices from database
     */
    async getDatabasePrices() {
        return await prisma.room.findMany({
            include: {
                images: true,
                amenities: true,
            },
            orderBy: {
                id: "asc",
            },
        });
    },
    /**
     * Get price change history (you could extend this to store in a separate table)
     */
    async getPriceChanges() {
        // For now, return recent updates. You could create a price_history table later.
        return [];
    },
};
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
}
