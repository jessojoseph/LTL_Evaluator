import { Router } from 'express';
import * as employeeController from '../controllers/employeeController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('employees:read'), employeeController.getAll);
router.get('/:id', requirePermission('employees:read'), employeeController.getById);
router.post('/', requirePermission('employees:create'), validate(createEmployeeSchema), employeeController.create);
router.put('/:id', requirePermission('employees:update'), validate(updateEmployeeSchema), employeeController.update);
router.delete('/:id', requirePermission('employees:delete'), employeeController.remove);
router.patch('/:id/toggle-status', requirePermission('employees:update'), employeeController.toggleStatus);

export default router;
