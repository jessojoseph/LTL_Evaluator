import { Router } from 'express';
import * as permissionController from '../controllers/permissionController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('permissions:read'), permissionController.getAll);
router.get('/:id', requirePermission('permissions:read'), permissionController.getById);
router.post('/', requirePermission('permissions:create'), permissionController.create);
router.put('/:id', requirePermission('permissions:update'), permissionController.update);
router.delete('/:id', requirePermission('permissions:delete'), permissionController.remove);

// Seed endpoint
router.post('/seed', requirePermission('permissions:create'), permissionController.seed);

export default router;
