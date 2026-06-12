import { Request, Response } from 'express';
import { Employee } from '../models/Employee';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status, leadId, search, isLead } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (leadId) filter.defaultLeadId = leadId;
    if (isLead !== undefined) filter.isLead = isLead === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(filter).populate('defaultLeadId', 'name');
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const employee = await Employee.findById(req.params.id).populate('defaultLeadId', 'name');
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json({ employee });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Employee with this email already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('defaultLeadId', 'name');

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json({ employee });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Employee with this email already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleStatus(req: Request, res: Response): Promise<void> {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    employee.status = employee.status === 'active' ? 'inactive' : 'active';
    await employee.save();
    await employee.populate('defaultLeadId', 'name');
    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
