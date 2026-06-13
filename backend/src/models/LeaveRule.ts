import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveRule extends Document {
  name: string;
  employmentType: string;
  leaveType: 'casual' | 'medical' | 'annual' | 'sick' | 'personal' | 'other';
  periodType: 'yearly' | 'half_yearly' | 'quarterly' | 'monthly';
  maxPerPeriod: number;
  annualAllocation: number;
  carryOver: boolean;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRuleSchema = new Schema<ILeaveRule>(
  {
    name: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      required: true,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'probation'],
    },
    leaveType: {
      type: String,
      required: true,
      enum: ['casual', 'medical', 'annual', 'sick', 'personal', 'other'],
    },
    periodType: {
      type: String,
      required: true,
      enum: ['yearly', 'half_yearly', 'quarterly', 'monthly'],
      default: 'yearly',
    },
    maxPerPeriod: { type: Number, required: true, min: 0 },
    annualAllocation: { type: Number, required: true, min: 0 },
    carryOver: { type: Boolean, default: false },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leaveRuleSchema.index({ employmentType: 1, leaveType: 1 }, { unique: true });

export const LeaveRule = mongoose.model<ILeaveRule>('LeaveRule', leaveRuleSchema);
