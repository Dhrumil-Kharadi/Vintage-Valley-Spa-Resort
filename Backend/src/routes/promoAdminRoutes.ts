import { Router } from 'express';
import { promoAdminController } from '../controllers/promoAdminController';
import { requireAuth, AuthedRequest } from '../middlewares/auth';

const router = Router();

// Simple role-based authorization middleware
const authorize = (roles: string[]) => (req: AuthedRequest, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

// All promo admin routes require authentication and admin/staff role
router.use(requireAuth);
router.use(authorize(['ADMIN', 'STAFF']));

router.get('/', promoAdminController.list);
router.post('/', promoAdminController.create);
router.patch('/:id', promoAdminController.update);
router.delete('/:id', promoAdminController.delete);

export default router;
