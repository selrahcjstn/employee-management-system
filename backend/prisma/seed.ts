import 'dotenv/config';
import { hashPassword } from '../src/common/password.js';
import { db } from '../src/prisma/db.js';

const email = process.env['SEED_ADMIN_EMAIL']?.trim().toLowerCase();
const password = process.env['SEED_ADMIN_PASSWORD'];
const fullName = process.env['SEED_ADMIN_NAME']?.trim() || 'Administrator';

if (!email || !password) {
  throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set');
}

const users = db.orm.public.User;
const existing = await users.where({ email }).first();
if (existing) {
  console.log(`Admin ${email} already exists, nothing to do`);
} else {
  await users.create({ email, passwordHash: await hashPassword(password), fullName, role: 'admin' });
  console.log(`Created admin ${email}`);
}
await db.close();
