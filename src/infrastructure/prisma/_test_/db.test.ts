import { loadEnvConfig } from "@next/env";
import { expect, it, vi } from "vitest";

it.skipIf(process.env.PRISMA_TEST_DATABASE !== "1")("queries PostgreSQL and reuses the client after module reloads", async () => {
  loadEnvConfig(process.cwd(), true);
  const { db } = await import("../db");

  try {
    vi.resetModules();
    expect((await import("../db")).db).toBe(db);

    const query = db.raw.sql`SELECT 1::int AS ok`
      .returnsRow({ ok: "pg/int4@1" })
      .build();
    expect(await db.runtime().query(query)).toEqual([{ ok: 1 }]);
  } finally {
    await db.close();
  }
}, 30_000);
