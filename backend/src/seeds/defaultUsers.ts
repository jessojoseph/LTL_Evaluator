import bcrypt from 'bcryptjs';

export const defaultUsers = [
  {
    name: 'Admin User',
    email: 'info@leopardtechlabs.com',
    passwordHash: '', // will be set during seeding
    status: 'active' as const,
  },
];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
