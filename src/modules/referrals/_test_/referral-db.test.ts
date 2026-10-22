import { loadEnvConfig } from "@next/env";
import { expect, it } from "vitest";

loadEnvConfig(process.cwd(), true);

it.skipIf(process.env.PRISMA_TEST_DATABASE !== "1")(
  "finds an active referral in PostgreSQL",
  async () => {
    const { findActiveReferral } = await import(
      "../referral-store"
    );
    const { db } = await import(
      "@/infrastructure/prisma/db"
    );

    try {
      const referral = await findActiveReferral("roger10");

      expect(referral).toMatchObject({
        code: "ROGER10",
      });

      const invalid = await findActiveReferral("UNKNOWN");
      expect(invalid).toBeNull();
    } finally {
      await db.close();
    }
  },
  30_000
);