import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectLead extends Document {
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const projectLeadSchema = new Schema<IProjectLead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const ProjectLead = mongoose.model<IProjectLead>('ProjectLead', projectLeadSchema);
