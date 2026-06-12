import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAllocation extends Document {
  weekId: Types.ObjectId;
  projectLeadId: Types.ObjectId;
  projectId: Types.ObjectId;
  employeeId: Types.ObjectId;
  allocatedDays: number;
  extraHours: number;
  allocatedWH: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const allocationSchema = new Schema<IAllocation>(
  {
    weekId: { type: Schema.Types.ObjectId, ref: 'Week', required: true },
    projectLeadId: { type: Schema.Types.ObjectId, ref: 'ProjectLead', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    allocatedDays: { type: Number, required: true, min: 0 },
    extraHours: { type: Number, default: 0, min: 0 },
    allocatedWH: { type: Number, required: true },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

allocationSchema.index({ weekId: 1, employeeId: 1 });
allocationSchema.index({ weekId: 1, projectId: 1 });

export const Allocation = mongoose.model<IAllocation>('Allocation', allocationSchema);
