"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomRouter = void 0;
const express_1 = require("express");
const roomController_1 = require("../controllers/roomController");
exports.roomRouter = (0, express_1.Router)();
exports.roomRouter.get("/", roomController_1.roomController.list);
exports.roomRouter.get("/:id", roomController_1.roomController.getById);
