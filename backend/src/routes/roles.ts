import { Router } from 'express';
import * as roleController from '../controllers/roleController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.post('/', requirePermission('roles:create'), roleController.create);
router.put('/:id', requirePermission('roles:update'), roleController.update);
router.delete('/:id', requirePermission('roles:delete'), roleController.remove);
router.patch('/:id/toggle-status', requirePermission('roles:update'), roleController.toggleStatus);

export default router;
