#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/179c07693aad56fd1aeff3e0a51fc34e81b5bd7136e5fa4d51e8d03a6b80fec2/contract';
import endContract from '../../snapshots/179c07693aad56fd1aeff3e0a51fc34e81b5bd7136e5fa4d51e8d03a6b80fec2/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/1a80377e75c81c8cea4cd94e40e3f8da5e3b83fba31b0799ebecd4a0398a67d8/contract';
import startContract from '../../snapshots/1a80377e75c81c8cea4cd94e40e3f8da5e3b83fba31b0799ebecd4a0398a67d8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'ReferralAttribution',
        columns: [
          col('bookingId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('referralCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ReferralAttribution',
        constraint: 'ReferralAttribution_bookingId_key',
        columns: ['bookingId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
