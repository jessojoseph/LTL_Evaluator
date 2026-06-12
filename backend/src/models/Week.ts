import mongoose, { Schema, Document } from 'mongoose';

export interface IWeek extends Document {
  weekName: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  hoursPerDay: number;
  weeklyCapacity: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const weekSchema = new Schema<IWeek>(
  {
    weekName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    workingDays: { type: Number, required: true, min: 1 },
    hoursPerDay: { type: Number, required: true, min: 0.5 },
    weeklyCapacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

export const Week = mongoose.model<IWeek>('Week', weekSchema);
