import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users:read'), userController.getAll);
router.get('/:id', requirePermission('users:read'), userController.getById);
router.post('/', requirePermission('users:create'), userController.create);
router.put('/:id', requirePermission('users:update'), userController.update);
router.delete('/:id', requirePermission('users:delete'), userController.remove);
router.patch('/:id/toggle-status', requirePermission('users:update'), userController.toggleStatus);

export default router;
