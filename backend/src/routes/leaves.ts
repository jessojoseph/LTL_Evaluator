import { Router } from 'express';
import * as leaveController from '../controllers/leaveController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLeaveSchema, updateLeaveSchema, createSelfLeaveSchema } from '../validators';

const router = Router();

router.use(authenticate);

// Self-service routes — employees manage their own leaves
router.get('/self', requirePermission('leaves:self'), leaveController.getSelf);
router.post('/self', requirePermission('leaves:self'), validate(createSelfLeaveSchema), leaveController.createSelf);
router.patch('/self/:id/cancel', requirePermission('leaves:self'), leaveController.cancelSelf);

// Admin/HR routes — manage all leaves
router.get('/', requirePermission('leaves:read'), leaveController.getAll);
router.get('/:id', requirePermission('leaves:read'), leaveController.getById);
router.post('/', requirePermission('leaves:create'), validate(createLeaveSchema), leaveController.create);
router.put('/:id', requirePermission('leaves:update'), validate(updateLeaveSchema), leaveController.update);
router.delete('/:id', requirePermission('leaves:delete'), leaveController.remove);
router.patch('/:id/approve', requirePermission('leaves:approve'), leaveController.approve);
router.patch('/:id/reject', requirePermission('leaves:approve'), leaveController.reject);
router.patch('/:id/revoke', requirePermission('leaves:approve'), leaveController.revoke);

export default router;
