import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requirePermission('reports:read'), reportController.dashboard);
router.get('/employee-utilization', requirePermission('reports:read'), reportController.employeeUtilization);
router.get('/project-wise', requirePermission('reports:read'), reportController.projectWise);
router.get('/lead-summary', requirePermission('reports:read'), reportController.leadSummary);
router.get('/free-resources', requirePermission('reports:read'), reportController.freeResources);
router.get('/overbooked-resources', requirePermission('reports:read'), reportController.overbookedResources);
router.get('/week-comparison', requirePermission('reports:read'), reportController.weekComparison);

export default router;
