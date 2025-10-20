import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@local.test';
  const raw = process.env.ADMIN_PASSWORD ?? 'Password123!';
  const role = process.env.ADMIN_ROLE ?? 'ADMIN';
  const existing = await prisma.user.findUnique({ where: { email } });
  const hash = await bcrypt.hash(raw, 10);
  if (existing) {
    console.log('Updating admin user password/role...');
    await prisma.user.update({ where: { email }, data: { password: hash, role } });
    console.log('Admin updated');
  } else {
    console.log('Creating admin user...');
    const u = await prisma.user.create({ data: { email, password: hash, name: 'Admin', role } });
    console.log('Created admin:', u.id);
  }
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
