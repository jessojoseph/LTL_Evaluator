import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProjectWeekStatus extends Document {
  weekId: Types.ObjectId;
  projectId: Types.ObjectId;
  status?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectWeekStatusSchema = new Schema<IProjectWeekStatus>(
  {
    weekId: { type: Schema.Types.ObjectId, ref: 'Week', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    status: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

projectWeekStatusSchema.index({ weekId: 1, projectId: 1 }, { unique: true });

export const ProjectWeekStatus = mongoose.model<IProjectWeekStatus>(
  'ProjectWeekStatus',
  projectWeekStatusSchema
);
