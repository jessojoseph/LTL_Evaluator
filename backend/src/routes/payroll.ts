import { Router } from 'express';
import * as payrollController from '../controllers/payrollController';
import * as exportController from '../controllers/exportController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/monthly-summary', requirePermission('reports:payroll'), payrollController.monthlyLeaveSummary);
router.get('/export', requirePermission('reports:payroll'), exportController.exportMonthlyPayroll);

export default router;
