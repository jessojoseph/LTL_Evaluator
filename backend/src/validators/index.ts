import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Employee validators
export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    defaultLeadId: z.string().optional().transform((v) => (v === '' ? undefined : v)),
    isLead: z.boolean().optional(),
    status: z.enum(['active', 'inactive', 'resigned']).optional(),
    employeeCode: z.string().optional(),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern', 'probation']).optional(),
    skills: z.array(z.string()).optional(),
    joinDate: z.string().optional(),
    resignationDate: z.string().optional(),
    resignationReason: z.enum(['resigned', 'moved_city', 'career_change', 'retirement', 'termination', 'other']).optional(),
    resignationNotes: z.string().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    defaultLeadId: z.string().optional().transform((v) => (v === '' ? undefined : v)),
    isLead: z.boolean().optional(),
    status: z.enum(['active', 'inactive', 'resigned']).optional(),
    employeeCode: z.string().optional(),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern', 'probation']).optional(),
    skills: z.array(z.string()).optional(),
    joinDate: z.string().optional(),
    resignationDate: z.string().optional(),
    resignationReason: z.enum(['resigned', 'moved_city', 'career_change', 'retirement', 'termination', 'other']).optional(),
    resignationNotes: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Project validators
export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').trim(),
    projectLeadId: z.string().min(1, 'Project lead is required'),
    clientName: z.string().optional(),
    projectType: z.enum(['internal', 'client', 'support']).optional(),
    status: z.enum(['active', 'on_hold', 'completed', 'no_work']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    projectLeadId: z.string().optional(),
    clientName: z.string().optional(),
    projectType: z.enum(['internal', 'client', 'support']).optional(),
    status: z.enum(['active', 'on_hold', 'completed', 'no_work']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Week validators
export const createWeekSchema = z.object({
  body: z.object({
    weekName: z.string().min(1, 'Week name is required').trim(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    workingDays: z.number().min(1, 'Working days must be greater than 0'),
    hoursPerDay: z.number().min(0.5, 'Hours per day must be greater than 0'),
    status: z.enum(['draft', 'published', 'closed']).optional(),
  }),
});

export const updateWeekSchema = z.object({
  body: z.object({
    weekName: z.string().min(1).trim().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    workingDays: z.number().min(1).optional(),
    hoursPerDay: z.number().min(0.5).optional(),
    status: z.enum(['draft', 'published', 'closed']).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Allocation validators
export const createAllocationSchema = z.object({
  body: z.object({
    weekId: z.string().min(1, 'Week is required'),
    projectLeadId: z.string().min(1, 'Project lead is required'),
    projectId: z.string().min(1, 'Project is required'),
    employeeId: z.string().min(1, 'Employee is required'),
    allocatedDays: z.number().min(0, 'Days cannot be negative'),
    extraHours: z.number().min(0, 'Extra hours cannot be negative').default(0),
    remarks: z.string().optional(),
  }),
});

export const updateAllocationSchema = z.object({
  body: z.object({
    weekId: z.string().optional(),
    projectLeadId: z.string().optional(),
    projectId: z.string().optional(),
    employeeId: z.string().optional(),
    allocatedDays: z.number().min(0).optional(),
    extraHours: z.number().min(0).optional(),
    remarks: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const bulkAllocationSchema = z.object({
  body: z.object({
    allocations: z
      .array(
        z.object({
          weekId: z.string().min(1),
          projectLeadId: z.string().min(1),
          projectId: z.string().min(1),
          employeeId: z.string().min(1),
          allocatedDays: z.number().min(0),
          extraHours: z.number().min(0).default(0),
          remarks: z.string().optional(),
        })
      )
      .min(1, 'At least one allocation is required'),
  }),
});

// Leave validators
export const createLeaveSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    type: z.enum(['annual', 'sick', 'personal', 'other', 'casual', 'medical']),
    reason: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    approvedBy: z.string().optional(),
  }),
});

export const updateLeaveSchema = z.object({
  body: z.object({
    employeeId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['annual', 'sick', 'personal', 'other', 'casual', 'medical']).optional(),
    reason: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    approvedBy: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Self-service leave validators (no employeeId — auto-assigned from logged-in user)
export const createSelfLeaveSchema = z.object({
  body: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    type: z.enum(['annual', 'sick', 'personal', 'other', 'casual', 'medical']),
    reason: z.string().optional(),
  }),
});

// Leave Rule validators
export const createLeaveRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern', 'probation']),
    leaveType: z.enum(['casual', 'medical', 'annual', 'sick', 'personal', 'other']),
    periodType: z.enum(['yearly', 'half_yearly', 'quarterly', 'monthly']),
    maxPerPeriod: z.number().min(0, 'Max per period cannot be negative'),
    annualAllocation: z.number().min(0, 'Annual allocation cannot be negative'),
    carryOver: z.boolean().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateLeaveRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern', 'probation']).optional(),
    leaveType: z.enum(['casual', 'medical', 'annual', 'sick', 'personal', 'other']).optional(),
    periodType: z.enum(['yearly', 'half_yearly', 'quarterly', 'monthly']).optional(),
    maxPerPeriod: z.number().min(0).optional(),
    annualAllocation: z.number().min(0).optional(),
    carryOver: z.boolean().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});
