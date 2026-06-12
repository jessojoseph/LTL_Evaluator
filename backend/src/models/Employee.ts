import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  defaultLeadId?: Types.ObjectId;
  status: 'active' | 'inactive';
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
    defaultLeadId: { type: Schema.Types.ObjectId, ref: 'ProjectLead' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
