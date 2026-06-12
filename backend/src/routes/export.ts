import { Router } from 'express';
import * as exportController from '../controllers/exportController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/weekly-report', requirePermission('export:read'), exportController.exportWeeklyReport);
router.get('/employee-utilization', requirePermission('export:read'), exportController.exportEmployeeUtilization);
router.get('/project-wise', requirePermission('export:read'), exportController.exportProjectWise);

export default router;
