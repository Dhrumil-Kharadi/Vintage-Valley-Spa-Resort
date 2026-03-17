import { Router } from 'express';
import { getTariffs, updateTariff } from '../controllers/tariffController';

const router = Router();

router.get('/', getTariffs);
router.put('/:id', updateTariff);

export default router;
