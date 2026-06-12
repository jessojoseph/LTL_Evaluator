import { Router } from 'express';
import * as projectLeadController from '../controllers/projectLeadController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProjectLeadSchema, updateProjectLeadSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('project_leads:read'), projectLeadController.getAll);
router.get('/:id', requirePermission('project_leads:read'), projectLeadController.getById);
router.post('/', requirePermission('project_leads:create'), validate(createProjectLeadSchema), projectLeadController.create);
router.put('/:id', requirePermission('project_leads:update'), validate(updateProjectLeadSchema), projectLeadController.update);
router.delete('/:id', requirePermission('project_leads:delete'), projectLeadController.remove);

export default router;
