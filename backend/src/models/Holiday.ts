import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  date: Date;
  name: string;
  type: 'national' | 'optional' | 'company' | 'working_saturday';
  year: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>(
  {
    date: { type: Date, required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['national', 'optional', 'company', 'working_saturday'],
      default: 'national',
    },
    year: { type: Number, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

export const Holiday = mongoose.model<IHoliday>('Holiday', holidaySchema);
