"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDataController = void 0;
const asyncHandler_1 = require("../../../Backend/src/utils/asyncHandler");
const adminDataService_1 = require("../services/adminDataService");
exports.adminDataController = {
    users: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const users = await adminDataService_1.adminDataService.listUsers();
        res.json({ ok: true, data: { users } });
    }),
    bookings: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const bookings = await adminDataService_1.adminDataService.listBookings();
        res.json({ ok: true, data: { bookings } });
    }),
    payments: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const payments = await adminDataService_1.adminDataService.listPayments();
        res.json({ ok: true, data: { payments } });
    }),
    rooms: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const rooms = await adminDataService_1.adminDataService.listRooms();
        res.json({ ok: true, data: { rooms } });
    }),
};
