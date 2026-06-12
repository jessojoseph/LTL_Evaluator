import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  projectLeadId: Types.ObjectId;
  clientName?: string;
  projectType?: 'internal' | 'client' | 'support';
  status: 'active' | 'on_hold' | 'completed' | 'no_work';
  priority?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    projectLeadId: { type: Schema.Types.ObjectId, ref: 'ProjectLead', required: true },
    clientName: { type: String, trim: true },
    projectType: { type: String, enum: ['internal', 'client', 'support'] },
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'no_work'],
      required: true,
      default: 'active',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', projectSchema);
