import { PrismaClient } from "../prisma/generated/client.js";
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
export { PrismaClient, Prisma } from "../prisma/generated/client.js";
export type { Transfer } from "../prisma/generated/client.js";