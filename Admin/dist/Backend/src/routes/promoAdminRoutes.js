"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promoAdminController_1 = require("../controllers/promoAdminController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Simple role-based authorization middleware
const authorize = (roles) => (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role))
        return res.status(403).json({ message: 'Forbidden' });
    next();
};
// All promo admin routes require authentication and admin/staff role
router.use(auth_1.requireAuth);
router.use(authorize(['ADMIN', 'STAFF']));
router.get('/', promoAdminController_1.promoAdminController.list);
router.post('/', promoAdminController_1.promoAdminController.create);
router.patch('/:id', promoAdminController_1.promoAdminController.update);
router.delete('/:id', promoAdminController_1.promoAdminController.delete);
exports.default = router;
