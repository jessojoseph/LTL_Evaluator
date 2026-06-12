import { Router } from 'express';
import * as weekController from '../controllers/weekController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createWeekSchema, updateWeekSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('weeks:read'), weekController.getAll);
router.get('/:id', requirePermission('weeks:read'), weekController.getById);
router.post('/', requirePermission('weeks:create'), validate(createWeekSchema), weekController.create);
router.put('/:id', requirePermission('weeks:update'), validate(updateWeekSchema), weekController.update);
router.delete('/:id', requirePermission('weeks:delete'), weekController.remove);
router.patch('/:id/toggle-status', requirePermission('weeks:update'), weekController.toggleStatus);
router.post('/:id/copy-from/:previousWeekId', requirePermission('weeks:copy'), weekController.copyFromPreviousWeek);

export default router;
