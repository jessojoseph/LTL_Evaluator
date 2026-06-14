import { Router } from 'express';
import * as holidayController from '../controllers/holidayController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('holidays:read'), holidayController.getAll);
router.get('/:id', requirePermission('holidays:read'), holidayController.getById);
router.post('/', requirePermission('holidays:create'), holidayController.create);
router.put('/:id', requirePermission('holidays:update'), holidayController.update);
router.delete('/:id', requirePermission('holidays:delete'), holidayController.remove);

export default router;
