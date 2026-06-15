import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Role } from '../models/Role';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status, leadId, search, isLead, employmentType } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (leadId) filter.defaultLeadId = leadId;
    if (isLead !== undefined) filter.isLead = isLead === 'true';
    if (employmentType) filter.employmentType = employmentType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
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

    // Sync: Create corresponding User if they don't exist
    let user = await User.findOne({ email: employee.email.toLowerCase() });
    let tempPassword = '';

    if (!user) {
      const roleName = employee.isLead ? 'Project Lead' : 'Employee';
      const role = await Role.findOne({ name: roleName });

      if (role) {
        tempPassword = 'LTL@welcome123';
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        user = new User({
          name: employee.name,
          email: employee.email.toLowerCase(),
          passwordHash,
          roleId: role._id,
          status: employee.status === 'active' ? 'active' : 'inactive',
        });
        await user.save();
      }
    }

    res.status(201).json({ employee, tempPassword });
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
    const oldEmployee = await Employee.findById(req.params.id);
    if (!oldEmployee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    const oldEmail = oldEmployee.email;

    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('defaultLeadId', 'name');

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Sync corresponding User if exists
    const user = await User.findOne({ email: oldEmail.toLowerCase() });
    if (user) {
      user.name = employee.name;
      user.email = employee.email.toLowerCase();
      user.status = employee.status === 'active' ? 'active' : 'inactive';

      const roleName = employee.isLead ? 'Project Lead' : 'Employee';
      const role = await Role.findOne({ name: roleName });
      if (role) {
        user.roleId = role._id;
      }
      await user.save();
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
      { status: 'resigned', resignationDate: new Date() },
      { new: true }
    );
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Sync: Deactivate corresponding User
    await User.findOneAndUpdate(
      { email: employee.email.toLowerCase() },
      { status: 'inactive' }
    );

    res.json({ message: 'Employee marked as resigned successfully' });
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

    // Sync: Toggle corresponding User status
    await User.findOneAndUpdate(
      { email: employee.email.toLowerCase() },
      { status: employee.status }
    );

    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function resign(req: Request, res: Response): Promise<void> {
  try {
    const { resignationDate, resignationReason, resignationNotes } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    employee.status = 'resigned';
    employee.resignationDate = resignationDate ? new Date(resignationDate) : new Date();
    if (resignationReason) employee.resignationReason = resignationReason;
    if (resignationNotes !== undefined) employee.resignationNotes = resignationNotes;
    await employee.save();
    await employee.populate('defaultLeadId', 'name');

    // Sync: Deactivate corresponding User
    await User.findOneAndUpdate(
      { email: employee.email.toLowerCase() },
      { status: 'inactive' }
    );

    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
