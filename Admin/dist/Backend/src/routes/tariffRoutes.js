"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tariffController_1 = require("../controllers/tariffController");
const router = (0, express_1.Router)();
router.get('/', tariffController_1.getTariffs);
router.put('/:id', tariffController_1.updateTariff);
exports.default = router;
