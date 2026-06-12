import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('projects:read'), projectController.getAll);
router.get('/:id', requirePermission('projects:read'), projectController.getById);
router.post('/', requirePermission('projects:create'), validate(createProjectSchema), projectController.create);
router.put('/:id', requirePermission('projects:update'), validate(updateProjectSchema), projectController.update);
router.delete('/:id', requirePermission('projects:delete'), projectController.remove);

export default router;
