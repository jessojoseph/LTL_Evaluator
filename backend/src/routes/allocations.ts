import { Router } from 'express';
import * as allocationController from '../controllers/allocationController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAllocationSchema, updateAllocationSchema, bulkAllocationSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('allocations:read'), allocationController.getAll);
router.get('/:id', requirePermission('allocations:read'), allocationController.getById);
router.post('/', requirePermission('allocations:create'), validate(createAllocationSchema), allocationController.create);
router.put('/:id', requirePermission('allocations:update'), validate(updateAllocationSchema), allocationController.update);
router.delete('/:id', requirePermission('allocations:delete'), allocationController.remove);
router.post('/bulk', requirePermission('allocations:bulk_create'), validate(bulkAllocationSchema), allocationController.bulkCreate);

export default router;
