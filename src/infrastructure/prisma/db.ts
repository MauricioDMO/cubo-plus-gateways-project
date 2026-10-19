import "server-only";
import "temporal-polyfill/full/global";
import postgres, { type PostgresClient } from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

const globalForPrisma = globalThis as unknown as { gatewaysDb?: PostgresClient<Contract> };

export const db = globalForPrisma.gatewaysDb ?? postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== "production") globalForPrisma.gatewaysDb = db;
