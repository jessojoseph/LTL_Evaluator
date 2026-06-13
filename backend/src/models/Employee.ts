import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  isLead: boolean;
  defaultLeadId?: Types.ObjectId;
  status: 'active' | 'inactive' | 'resigned';
  employeeCode: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern' | 'probation';
  skills: string[];
  joinDate?: Date;
  resignationDate?: Date;
  resignationReason?: 'resigned' | 'moved_city' | 'career_change' | 'retirement' | 'termination' | 'other';
  resignationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    isLead: { type: Boolean, default: false },
    defaultLeadId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['active', 'inactive', 'resigned'], default: 'active' },
    employeeCode: { type: String, unique: true, sparse: true },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'probation'],
      default: 'full_time',
    },
    skills: [{ type: String, trim: true }],
    joinDate: { type: Date },
    resignationDate: { type: Date },
    resignationReason: {
      type: String,
      enum: ['resigned', 'moved_city', 'career_change', 'retirement', 'termination', 'other'],
    },
    resignationNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
