import { connectDB } from '../config/db';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { LeaveRule } from '../models/LeaveRule';
import { defaultPermissions } from './defaultPermissions';
import { defaultRoles } from './defaultRoles';
import mongoose from 'mongoose';

const defaultLeaveRules = [
  {
    name: 'Permanent Employee - Casual Leave',
    employmentType: 'full_time',
    leaveType: 'casual',
    periodType: 'half_yearly',
    maxPerPeriod: 6,
    annualAllocation: 12,
    carryOver: false,
    description: 'Full-time employees get 12 casual leaves per year, max 6 per half.',
    isActive: true,
  },
  {
    name: 'Permanent Employee - Medical Leave',
    employmentType: 'full_time',
    leaveType: 'medical',
    periodType: 'half_yearly',
    maxPerPeriod: 3,
    annualAllocation: 3,
    carryOver: false,
    description: 'Full-time employees get 3 medical leaves per year, max 3 per half.',
    isActive: true,
  },
  {
    name: 'Probation - Casual Leave',
    employmentType: 'probation',
    leaveType: 'casual',
    periodType: 'yearly',
    maxPerPeriod: 6,
    annualAllocation: 6,
    carryOver: false,
    description: 'Probation employees get 6 casual leaves per year.',
    isActive: true,
  },
];

async function seed() {
  await connectDB();

  console.log('🌱 Seeding permissions...');
  for (const perm of defaultPermissions) {
    const existing = await Permission.findOne({ name: perm.name });
    if (!existing) {
      await Permission.create(perm);
      console.log(`  ✅ Created permission: ${perm.name}`);
    } else {
      console.log(`  ⏭️  Skipped (exists): ${perm.name}`);
    }
  }

  console.log('\n🌱 Seeding roles...');
  for (const roleDef of defaultRoles) {
    const role = await Role.findOne({ name: roleDef.name });
    if (role) {
      const existingPerms = new Set(role.permissions);
      let added = 0;
      for (const p of roleDef.permissions) {
        if (!existingPerms.has(p)) {
          role.permissions.push(p);
          added++;
        }
      }
      if (added > 0) {
        await role.save();
        console.log(`  ✅ Updated "${roleDef.name}" role (+${added} permissions)`);
      } else {
        console.log(`  ⏭️  "${roleDef.name}" role already up to date`);
      }
    } else {
      console.log(`  ⚠️  "${roleDef.name}" role not found in database (seed manually via UI)`);
    }
  }

  console.log('\n🌱 Seeding default leave rules...');
  for (const ruleDef of defaultLeaveRules) {
    const existing = await LeaveRule.findOne({
      employmentType: ruleDef.employmentType,
      leaveType: ruleDef.leaveType,
    });
    if (!existing) {
      await LeaveRule.create(ruleDef);
      console.log(`  ✅ Created rule: ${ruleDef.name}`);
    } else {
      console.log(`  ⏭️  Skipped (exists): ${ruleDef.name}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n✨ Seeding complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
