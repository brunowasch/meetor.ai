import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || "";
  const adapter = new PrismaMariaDb(connectionString);

  return new PrismaClient({
    adapter,
    log: ["error"]
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;