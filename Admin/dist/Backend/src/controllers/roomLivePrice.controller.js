"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomLivePriceController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const errorHandler_1 = require("../middlewares/errorHandler");
const ezeeLivePrice_service_1 = require("../services/ezeeLivePrice.service");
const roomPriceSync_service_1 = require("../services/roomPriceSync.service");
const priceSyncScheduler_service_1 = require("../services/priceSyncScheduler.service");
const isoToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};
const addDaysIso = (iso, days) => {
    const dt = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime()))
        return iso;
    dt.setUTCDate(dt.getUTCDate() + days);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};
const toInt = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.trunc(n);
};
exports.roomLivePriceController = {
    getPrices: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const checkIn = String(req.query.checkIn ?? isoToday());
        const checkOut = String(req.query.checkOut ?? addDaysIso(isoToday(), 1));
        const adults = toInt(req.query.adults, 1);
        const children = toInt(req.query.children, 0);
        const rooms = toInt(req.query.rooms, 1);
        const syncToDb = req.query.syncToDb === "true";
        try {
            const list = await ezeeLivePrice_service_1.ezeeLivePriceService.fetchLivePrices({
                checkIn,
                checkOut,
                adults,
                children,
                rooms,
            });
            // Sync prices to database if requested
            let syncUpdates = [];
            if (syncToDb) {
                try {
                    syncUpdates = await roomPriceSync_service_1.roomPriceSyncService.syncPricesToDatabase();
                }
                catch (syncError) {
                    console.error("Failed to sync to database, but returning live prices:", syncError);
                }
            }
            const roomPrices = list.map((r) => ({
                roomType: r.Room_Name,
                price: r.avg_price_per_night,
                currency: r.currency_sign || "INR",
                availability: r.available_rooms,
            }));
            res.json({
                success: true,
                rooms: roomPrices,
                ...(syncToDb && { syncUpdates: syncUpdates.length }),
            });
        }
        catch (err) {
            console.error("[roomLivePriceController] Failed to fetch room prices:", err);
            if (err instanceof errorHandler_1.HttpError) {
                res.status(err.statusCode).json({
                    success: false,
                    error: err.message,
                    message: err.message,
                });
            }
            else {
                res.status(502).json({
                    success: false,
                    error: "Failed to fetch room prices",
                    message: "Unable to retrieve live prices from eZee API",
                });
            }
        }
    }),
    syncPrices: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const updates = await roomPriceSync_service_1.roomPriceSyncService.syncPricesToDatabase();
            res.json({
                success: true,
                message: `Successfully synced prices for ${updates.length} rooms`,
                updates: updates.map(u => ({
                    roomId: u.roomId,
                    title: u.title,
                    priceChanged: u.oldPricePerNight !== u.newPricePerNight,
                    oldPrice: u.oldPricePerNight,
                    newPrice: u.newPricePerNight,
                    availabilityChanged: u.oldAvailability !== u.newAvailability,
                    oldAvailability: u.oldAvailability,
                    newAvailability: u.newAvailability,
                })),
            });
        }
        catch (err) {
            console.error("[roomLivePriceController] Failed to sync prices:", err);
            if (err instanceof errorHandler_1.HttpError) {
                res.status(err.statusCode).json({
                    success: false,
                    error: err.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: "Failed to sync prices",
                    message: "Unable to sync prices to database",
                });
            }
        }
    }),
    getDatabasePrices: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const rooms = await roomPriceSync_service_1.roomPriceSyncService.getDatabasePrices();
            res.json({
                success: true,
                rooms: rooms.map(room => ({
                    id: room.id,
                    title: room.title,
                    description: room.description,
                    pricePerNight: room.pricePerNight,
                    epPricePerNight: room.epPricePerNight,
                    cpPricePerNight: room.cpPricePerNight,
                    mapPricePerNight: room.mapPricePerNight,
                    person: room.person,
                    availableRooms: room.availableRooms,
                    images: room.images,
                    amenities: room.amenities,
                    updatedAt: room.updatedAt,
                })),
            });
        }
        catch (err) {
            console.error("[roomLivePriceController] Failed to get database prices:", err);
            res.status(500).json({
                success: false,
                error: "Failed to get database prices",
            });
        }
    }),
    startScheduler: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const intervalMinutes = parseInt(req.body.intervalMinutes || "60");
            priceSyncScheduler_service_1.priceSyncScheduler.start(intervalMinutes);
            res.json({
                success: true,
                message: `Price sync scheduler started with ${intervalMinutes} minute interval`,
            });
        }
        catch (err) {
            console.error("[roomLivePriceController] Failed to start scheduler:", err);
            res.status(500).json({
                success: false,
                error: "Failed to start scheduler",
            });
        }
    }),
    stopScheduler: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            priceSyncScheduler_service_1.priceSyncScheduler.stop();
            res.json({
                success: true,
                message: "Price sync scheduler stopped",
            });
        }
        catch (err) {
            console.error("[roomLivePriceController] Failed to stop scheduler:", err);
            res.status(500).json({
                success: false,
                error: "Failed to stop scheduler",
            });
        }
    }),
    getSchedulerStatus: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const status = priceSyncScheduler_service_1.priceSyncScheduler.getStatus();
            res.json({
                success: true,
                status,
            });
        }
        catch (err) {
            console.error("[roomLivePriceController] Failed to get scheduler status:", err);
            res.status(500).json({
                success: false,
                error: "Failed to get scheduler status",
            });
        }
    }),
};
