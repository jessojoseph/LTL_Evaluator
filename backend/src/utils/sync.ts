import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Role } from '../models/Role';

export async function syncExistingEmployees(): Promise<void> {
  try {
    const employees = await Employee.find({});
    console.log(`🔍 [SYNC] Checking user login accounts for ${employees.length} existing employees...`);
    
    let createdCount = 0;
    
    // Find system roles
    const employeeRole = await Role.findOne({ name: 'Employee' });
    const leadRole = await Role.findOne({ name: 'Project Lead' });
    
    if (!employeeRole || !leadRole) {
      console.log('⚠️ [SYNC] Roles "Employee" and "Project Lead" must be seeded first to sync accounts.');
      return;
    }
    
    for (const emp of employees) {
      const emailLower = emp.email.toLowerCase();
      const existingUser = await User.findOne({ email: emailLower });
      
      if (!existingUser) {
        // Create corresponding user account
        const tempPassword = 'LTL@welcome123';
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const roleId = emp.isLead ? leadRole._id : employeeRole._id;
        
        const newUser = new User({
          name: emp.name,
          email: emailLower,
          passwordHash,
          roleId,
          status: emp.status === 'active' ? 'active' : 'inactive',
        });
        
        await newUser.save();
        createdCount++;
        console.log(`✅ [SYNC] Created user login account for: ${emp.name} (${emailLower})`);
      }
    }
    
    if (createdCount > 0) {
      console.log(`🎉 [SYNC] Successfully synchronized ${createdCount} missing employee user accounts.`);
    } else {
      console.log('🚀 [SYNC] All existing employees already have synchronized user accounts.');
    }
  } catch (error) {
    console.error('❌ [SYNC] Error syncing existing employees with user accounts:', error);
  }
}
