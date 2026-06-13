import { Router } from 'express';
import * as leaveRuleController from '../controllers/leaveRuleController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLeaveRuleSchema, updateLeaveRuleSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('leave_rules:read'), leaveRuleController.getAll);
router.get('/:id', requirePermission('leave_rules:read'), leaveRuleController.getById);
router.post('/', requirePermission('leave_rules:create'), validate(createLeaveRuleSchema), leaveRuleController.create);
router.put('/:id', requirePermission('leave_rules:update'), validate(updateLeaveRuleSchema), leaveRuleController.update);
router.delete('/:id', requirePermission('leave_rules:delete'), leaveRuleController.remove);

export default router;
