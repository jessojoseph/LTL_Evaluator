import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { Role } from './models/Role';
import { User } from './models/User';
import { Permission } from './models/Permission';
import { defaultRoles } from './seeds/defaultRoles';
import { defaultPermissions } from './seeds/defaultPermissions';
import { defaultUsers, hashPassword } from './seeds/defaultUsers';

async function seedData(): Promise<void> {
  try {
    // Seed permissions first
    const permCount = await Permission.countDocuments();
    if (permCount === 0) {
      await Permission.insertMany(defaultPermissions);
      console.log(`Seeded ${defaultPermissions.length} default permissions`);
    }

    // Seed roles
    const roleCount = await Role.countDocuments();
    if (roleCount === 0) {
      await Role.insertMany(defaultRoles);
      console.log(`Seeded ${defaultRoles.length} default roles`);
    }

    // Seed admin user
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const adminRole = await Role.findOne({ name: 'Admin' });
      if (adminRole) {
        const passwordHash = await hashPassword('admin123');
        await User.create({
          ...defaultUsers[0],
          passwordHash,
          roleId: adminRole._id,
        });
        console.log('Seeded admin user: info@leopardtechlabs.com / admin123');
      }
    }
  } catch (error) {
    console.error('Failed to seed data:', error);
  }
}

async function start() {
  try {
    await connectDB();
    await seedData();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
