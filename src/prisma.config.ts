import { loadEnvConfig } from "@next/env";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { definePrismaConfig } from "prisma/config";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./infrastructure/prisma/contract.prisma",
    db: {
      connection: process.env.DATABASE_URL,
    },
    migrations: { dir: "./infrastructure/prisma/migrations" },
  }),
  skills: {
    agents: ["agents"],
  },
});
