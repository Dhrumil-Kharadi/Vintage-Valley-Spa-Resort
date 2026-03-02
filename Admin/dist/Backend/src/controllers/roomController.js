"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const errorHandler_1 = require("../middlewares/errorHandler");
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const ezee_service_1 = require("../services/ezee.service");
const roomService_1 = require("../services/roomService");
const roomCache = client_2.prisma.roomCache;
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
const toRoomPayloadFromCache = (r) => {
    return {
        roomtypeunkid: String(r.roomtypeunkid),
        Room_Name: String(r.roomName ?? ""),
        Room_Description: String(r.description ?? ""),
        max_adult_occupancy: Number(r.maxAdult ?? 0),
        max_child_occupancy: Number(r.maxChild ?? 0),
        available_rooms: Number(r.availableRooms ?? 0),
        avg_price_per_night: Number(r.pricePerNight ?? 0),
        total_price: Number(r.totalPrice ?? 0),
        currency_sign: String(r.currency ?? ""),
        RoomAmenities: String(r.amenities ?? ""),
        room_main_image: r.imageUrl ? String(r.imageUrl) : undefined,
    };
};
exports.roomController = {
    list: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const today = isoToday();
        const checkIn = String(req.query.checkIn ?? today);
        const checkOut = String(req.query.checkOut ?? addDaysIso(today, 1));
        const adults = toInt(req.query.adults, 1);
        const children = toInt(req.query.children, 0);
        const rooms = toInt(req.query.rooms, 1);
        try {
            const list = await ezee_service_1.ezeeService.fetchRoomList({
                checkIn,
                checkOut,
                adults,
                children,
                rooms,
            });
            await Promise.all(list.map(async (r) => {
                let roomtypeunkid;
                try {
                    roomtypeunkid = BigInt(String(r.roomtypeunkid));
                }
                catch {
                    return;
                }
                await roomCache.upsert({
                    where: { roomtypeunkid },
                    create: {
                        roomtypeunkid,
                        roomName: r.Room_Name,
                        description: r.Room_Description,
                        maxAdult: r.max_adult_occupancy,
                        maxChild: r.max_child_occupancy,
                        amenities: r.RoomAmenities,
                        pricePerNight: new client_1.Prisma.Decimal(String(r.avg_price_per_night ?? 0)),
                        totalPrice: new client_1.Prisma.Decimal(String(r.total_price ?? 0)),
                        currency: r.currency_sign,
                        availableRooms: r.available_rooms,
                        imageUrl: r.room_main_image ?? null,
                    },
                    update: {
                        roomName: r.Room_Name,
                        description: r.Room_Description,
                        maxAdult: r.max_adult_occupancy,
                        maxChild: r.max_child_occupancy,
                        amenities: r.RoomAmenities,
                        pricePerNight: new client_1.Prisma.Decimal(String(r.avg_price_per_night ?? 0)),
                        totalPrice: new client_1.Prisma.Decimal(String(r.total_price ?? 0)),
                        currency: r.currency_sign,
                        availableRooms: r.available_rooms,
                        imageUrl: r.room_main_image ?? null,
                        createdAt: new Date(),
                    },
                });
            }));
            res.json({ ok: true, data: { rooms: list } });
        }
        catch (err) {
            const cached = await roomCache.findMany({ orderBy: { createdAt: "desc" } });
            if (cached.length > 0) {
                const roomsFromCache = cached.map(toRoomPayloadFromCache);
                res.status(200).json({ ok: true, data: { rooms: roomsFromCache }, meta: { cached: true } });
                return;
            }
            throw err;
        }
    }),
    getById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            throw new errorHandler_1.HttpError(400, "Invalid room id");
        const room = await roomService_1.roomService.getById(id);
        if (!room)
            throw new errorHandler_1.HttpError(404, "Room not found");
        const r = room;
        res.json({
            ok: true,
            id: r.id,
            title: r.title,
            description: r.description,
            pricePerNight: r.pricePerNight,
            epPricePerNight: r.epPricePerNight ?? null,
            cpPricePerNight: r.cpPricePerNight ?? null,
            mapPricePerNight: r.mapPricePerNight ?? null,
            person: r.person,
            amenities: (r.amenities ?? []).map((a) => a.name),
            images: (r.images ?? []).map((i) => i.url),
        });
    }),
};
