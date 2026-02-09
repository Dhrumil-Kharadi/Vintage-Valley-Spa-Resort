"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryRouter = void 0;
const express_1 = require("express");
const inquiryController_1 = require("../controllers/inquiryController");
exports.inquiryRouter = (0, express_1.Router)();
exports.inquiryRouter.post("/", inquiryController_1.inquiryController.create);
