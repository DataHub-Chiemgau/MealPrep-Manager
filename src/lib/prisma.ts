import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";
const absolutePath = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.join(process.cwd(), DB_PATH);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: absolutePath }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
