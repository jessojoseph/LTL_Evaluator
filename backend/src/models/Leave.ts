import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeave extends Document {
  employeeId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  type: 'annual' | 'sick' | 'personal' | 'other' | 'casual' | 'medical';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: Types.ObjectId;
  isLop: boolean;
  lopReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: {
      type: String,
      enum: ['annual', 'sick', 'personal', 'other', 'casual', 'medical'],
      required: true,
    },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    isLop: { type: Boolean, default: false },
    lopReason: { type: String, trim: true },
  },
  { timestamps: true }
);

leaveSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

export const Leave = mongoose.model<ILeave>('Leave', leaveSchema);
