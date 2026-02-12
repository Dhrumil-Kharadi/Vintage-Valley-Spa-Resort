"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoRouter = void 0;
const express_1 = require("express");
const promoController_1 = require("../controllers/promoController");
exports.promoRouter = (0, express_1.Router)();
exports.promoRouter.post("/validate", promoController_1.promoController.validate);
