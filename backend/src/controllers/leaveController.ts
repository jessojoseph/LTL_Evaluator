import { Request, Response } from 'express';
import { Leave } from '../models/Leave';
import { Employee } from '../models/Employee';
import { LeaveRule } from '../models/LeaveRule';
import { AuthRequest } from '../middleware/auth';

function getHalfYear(date: Date): 'H1' | 'H2' {
  return date.getMonth() < 6 ? 'H1' : 'H2';
}

function getPeriodStartEnd(periodType: string, date: Date): { start: Date; end: Date } {
  const year = date.getFullYear();
  if (periodType === 'yearly') {
    return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
  }
  if (periodType === 'half_yearly') {
    const half = getHalfYear(date);
    if (half === 'H1') {
      return { start: new Date(year, 0, 1), end: new Date(year, 5, 30) };
    }
    return { start: new Date(year, 6, 1), end: new Date(year, 11, 31) };
  }
  // Default to yearly
  return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
}

async function checkLeaveBalance(
  employeeId: string,
  employmentType: string,
  leaveType: string,
  requestedDays: number
): Promise<{ allowed: number; used: number; balance: number; willBeLop: boolean; lopReason?: string }> {
  // Find applicable rule
  const rule = await LeaveRule.findOne({ employmentType, leaveType, isActive: true });
  if (!rule) {
    // No rule configured — allow freely
    return { allowed: Infinity, used: 0, balance: Infinity, willBeLop: false };
  }

  const { start, end } = getPeriodStartEnd(rule.periodType, new Date());

  // Count approved leaves of this type in the current period
  const leavesInPeriod = await Leave.find({
    employeeId,
    type: leaveType,
    status: { $in: ['approved', 'pending'] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });

  let usedDays = 0;
  for (const l of leavesInPeriod) {
    const days = Math.max(1, Math.round((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    usedDays += days;
  }

  const balance = rule.maxPerPeriod - usedDays;
  const willBeLop = requestedDays > balance;
  const lopReason = willBeLop
    ? `${leaveType} leave exceeds the ${rule.maxPerPeriod}-day limit per ${rule.periodType.replace('_', ' ')}. ${requestedDays - Math.max(0, Math.floor(balance))} day(s) will be treated as Loss of Pay (LOP).`
    : undefined;

  return { allowed: rule.maxPerPeriod, used: usedDays, balance, willBeLop, lopReason };
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { employeeId, status, type, startDate, endDate } = req.query;
    const filter: Record<string, unknown> = {};

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) (filter.startDate as Record<string, unknown>).$gte = new Date(startDate as string);
      if (endDate) (filter.startDate as Record<string, unknown>).$lte = new Date(endDate as string);
    }

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email employeeCode')
      .populate('approvedBy', 'name')
      .sort({ startDate: -1 });
    res.json({ leaves });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'name email employeeCode')
      .populate('approvedBy', 'name');
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getSelf(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Find employee matching the logged-in user's email
    const employee = await Employee.findOne({ email: req.user.email.toLowerCase() });
    if (!employee) {
      res.status(404).json({ message: 'No employee record found for your account' });
      return;
    }

    const { status, type } = req.query;
    const filter: Record<string, unknown> = { employeeId: employee._id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email employeeCode')
      .populate('approvedBy', 'name')
      .sort({ startDate: -1 });

    res.json({ leaves });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createSelf(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Find employee matching the logged-in user's email
    const employee = await Employee.findOne({ email: req.user.email.toLowerCase() });
    if (!employee) {
      res.status(404).json({ message: 'No employee record found for your account' });
      return;
    }
    if (employee.status !== 'active') {
      res.status(400).json({ message: 'Cannot create leave for inactive or resigned employee' });
      return;
    }

    const { startDate, endDate, type, reason } = req.body;

    // Calculate leave days
    const days = Math.max(1, Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1);

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      employeeId: employee._id,
      status: { $ne: 'rejected' },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });

    if (overlapping) {
      res.status(409).json({ message: 'You already have a leave request for this period' });
      return;
    }

    // Check leave balance
    const balanceCheck = await checkLeaveBalance(
      employee._id.toString(),
      employee.employmentType,
      type,
      days
    );

    const leave = new Leave({
      employeeId: employee._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      reason,
      isLop: balanceCheck.willBeLop,
      lopReason: balanceCheck.lopReason,
    });
    await leave.save();
    await leave.populate('employeeId', 'name email employeeCode');

    res.status(201).json({
      leave,
      lopWarning: balanceCheck.willBeLop ? balanceCheck.lopReason : undefined,
    });
  } catch (error) {
    console.error('Leave create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { employeeId, startDate, endDate, type, reason } = req.body;

    // Check employee exists and is active
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    if (employee.status !== 'active') {
      res.status(400).json({ message: 'Cannot create leave for inactive or resigned employee' });
      return;
    }

    // Calculate leave days
    const days = Math.max(1, Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1);

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      employeeId,
      status: { $ne: 'rejected' },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });

    if (overlapping) {
      res.status(409).json({ message: 'Employee already has a leave request for this period' });
      return;
    }

    // Check leave balance
    const balanceCheck = await checkLeaveBalance(
      employeeId,
      employee.employmentType,
      type,
      days
    );

    const leave = new Leave({
      employeeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      reason,
      isLop: balanceCheck.willBeLop,
      lopReason: balanceCheck.lopReason,
    });
    await leave.save();
    await leave.populate('employeeId', 'name email employeeCode');

    res.status(201).json({
      leave,
      lopWarning: balanceCheck.willBeLop ? balanceCheck.lopReason : undefined,
    });
  } catch (error) {
    console.error('Leave create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const updates: Record<string, unknown> = { ...req.body };
    if (updates.startDate) updates.startDate = new Date(updates.startDate as string);
    if (updates.endDate) updates.endDate = new Date(updates.endDate as string);

    const leave = await Leave.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('employeeId', 'name email employeeCode')
      .populate('approvedBy', 'name');

    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ message: 'Leave deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function approve(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Look up the Employee by the logged-in user's email
    const approver = await Employee.findOne({ email: req.user.email.toLowerCase() });
    if (!approver) {
      res.status(404).json({ message: 'No employee record found for your account' });
      return;
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: approver._id },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'name email employeeCode')
      .populate('approvedBy', 'name');

    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function reject(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Look up the Employee by the logged-in user's email
    const approver = await Employee.findOne({ email: req.user.email.toLowerCase() });
    if (!approver) {
      res.status(404).json({ message: 'No employee record found for your account' });
      return;
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approvedBy: approver._id },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'name email employeeCode')
      .populate('approvedBy', 'name');

    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function cancelSelf(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Find employee matching the logged-in user
    const employee = await Employee.findOne({ email: req.user.email.toLowerCase() });
    if (!employee) {
      res.status(404).json({ message: 'No employee record found for your account' });
      return;
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }

    // Verify the leave belongs to this employee
    if (leave.employeeId.toString() !== employee._id.toString()) {
      res.status(403).json({ message: 'You can only cancel your own leave requests' });
      return;
    }

    // Only pending leaves can be cancelled
    if (leave.status !== 'pending') {
      res.status(400).json({ message: 'Only pending leave requests can be cancelled' });
      return;
    }

    leave.status = 'cancelled';
    await leave.save();
    await leave.populate('employeeId', 'name email employeeCode');

    res.json({ leave, message: 'Leave request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function editSelf(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const employee = await Employee.findOne({ email: req.user.email.toLowerCase() });
    if (!employee) {
      res.status(404).json({ message: 'No employee record found for your account' });
      return;
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }

    // Verify ownership
    if (leave.employeeId.toString() !== employee._id.toString()) {
      res.status(403).json({ message: 'You can only edit your own leave requests' });
      return;
    }

    // Only pending leaves can be edited
    if (leave.status !== 'pending') {
      res.status(400).json({ message: 'Only pending leave requests can be edited' });
      return;
    }

    const { startDate, endDate, type, reason } = req.body;

    // Recalculate LOP if dates changed
    if (startDate || endDate || type) {
      const days = Math.max(1, Math.round(
        (new Date(endDate || leave.endDate).getTime() - new Date(startDate || leave.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1);

      const balanceCheck = await checkLeaveBalance(
        employee._id.toString(),
        employee.employmentType,
        type || leave.type,
        days
      );

      leave.isLop = balanceCheck.willBeLop;
      leave.lopReason = balanceCheck.lopReason || undefined;
    }

    if (startDate) leave.startDate = new Date(startDate);
    if (endDate) leave.endDate = new Date(endDate);
    if (type) leave.type = type;
    if (reason !== undefined) leave.reason = reason;

    await leave.save();
    await leave.populate('employeeId', 'name email employeeCode');

    res.json({ leave, lopWarning: leave.isLop ? leave.lopReason : undefined });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getBalance(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const employee = await Employee.findOne({ email: req.user.email.toLowerCase() });
    if (!employee) {
      res.status(404).json({ message: 'No employee record found for your account' });
      return;
    }

    // Find all active rules for this employment type
    const rules = await LeaveRule.find({ employmentType: employee.employmentType, isActive: true });

    const balances = await Promise.all(
      rules.map(async (rule) => {
        const { start, end } = getPeriodStartEnd(rule.periodType, new Date());

        const leavesInPeriod = await Leave.find({
          employeeId: employee._id,
          type: rule.leaveType,
          status: { $in: ['approved', 'pending'] },
          startDate: { $lte: end },
          endDate: { $gte: start },
        });

        let usedDays = 0;
        for (const l of leavesInPeriod) {
          usedDays += Math.max(1, Math.round((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const remaining = Math.max(0, rule.maxPerPeriod - usedDays);

        return {
          leaveType: rule.leaveType,
          periodType: rule.periodType,
          maxPerPeriod: rule.maxPerPeriod,
          used: usedDays,
          remaining,
          annualAllocation: rule.annualAllocation,
        };
      })
    );

    res.json({ balances });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function revoke(req: Request, res: Response): Promise<void> {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }

    // Only approved leaves can be revoked
    if (leave.status !== 'approved') {
      res.status(400).json({ message: 'Only approved leave requests can be revoked' });
      return;
    }

    leave.status = 'cancelled';
    leave.approvedBy = undefined;
    await leave.save();
    await leave.populate([
      { path: 'employeeId', select: 'name email employeeCode' },
      { path: 'approvedBy', select: 'name' },
    ]);

    res.json({ leave, message: 'Leave revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
