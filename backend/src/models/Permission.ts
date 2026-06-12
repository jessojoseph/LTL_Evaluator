import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  label: string;
  description: string;
  module: string;
  isSystem: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    module: { type: String, required: true, trim: true },
    isSystem: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

permissionSchema.index({ module: 1 });

export const Permission = mongoose.model<IPermission>('Permission', permissionSchema);
