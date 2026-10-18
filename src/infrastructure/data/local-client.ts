/**
 * Local, read-only stand-in for the public Supabase client.
 *
 * The student copy of this site has no database. Every public read is served
 * from the JSON snapshots in data/*.json, which hold exactly what a visitor
 * already sees on the live site. This module implements only the query-builder
 * surface that modules/content/server/content.ts uses:
 *
 *   from(table) . select(columns) . eq / neq / in / gt / gte / lt / lte / ilike / is
 *               . order(column, { ascending }) . limit(n) . range(from, to)
 *               . single() / maybeSingle() / plain await
 *
 * Writes are not implemented on purpose. Nothing on the public side writes,
 * and the booking flow keeps its own in-memory store (modules/bookings/server/booking-store.ts).
 *
 * Errors use the PostgREST shape ({ code, message }) so the callers in
 * modules/content/server/content.ts keep their existing `PGRST116` handling.
 */
import pages from "@/data/pages.json";
import posts from "@/data/posts.json";
import listings from "@/data/listings.json";
import media from "@/data/media.json";
import terms from "@/data/terms.json";
import postTerms from "@/data/post_terms.json";
import listingTerms from "@/data/listing_terms.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type Tables = Record<string, Row[]>;
type QueryError = { code?: string; message: string };
type QueryResult = { data: Row; error: QueryError | null };
type ListResult = { data: Row[] | null; error: QueryError | null };

const TABLES: Tables = {
  pages,
  posts,
  listings,
  media,
  terms,
  post_terms: postTerms,
  listing_terms: listingTerms,
};

const NO_ROWS_CODE = "PGRST116";

type Filter =
  | { op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "is" | "ilike"; column: string; value: unknown }
  | { op: "in"; column: string; value: unknown[] };

/** Loose equality that matches PostgREST's text comparison (ids compare as text). */
function sameValue(cell: unknown, value: unknown): boolean {
  if (cell == null || value == null) return false;
  return cell === value || String(cell) === String(value);
}

/** Turns ISO-looking strings into epoch ms so timestamps with different offsets compare correctly. */
function comparable(value: unknown): number | string | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const time = Date.parse(value);
      if (!Number.isNaN(time)) return time;
    }
    return value;
  }
  return String(value);
}

/** Ascending comparison; nulls sort last, as in Postgres' default ordering. */
function compareValues(a: unknown, b: unknown): number {
  const left = comparable(a);
  const right = comparable(b);
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left) < String(right) ? -1 : 1;
}

function likeToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

function matches(row: Row, filter: Filter): boolean {
  const cell = row[filter.column];
  switch (filter.op) {
    case "eq":
      return sameValue(cell, filter.value);
    case "neq":
      return cell != null && !sameValue(cell, filter.value);
    case "in":
      return filter.value.some((value) => sameValue(cell, value));
    case "gt":
      return cell != null && compareValues(cell, filter.value) > 0;
    case "gte":
      return cell != null && compareValues(cell, filter.value) >= 0;
    case "lt":
      return cell != null && compareValues(cell, filter.value) < 0;
    case "lte":
      return cell != null && compareValues(cell, filter.value) <= 0;
    case "is":
      return filter.value === null ? cell == null : cell === filter.value;
    case "ilike":
      return typeof cell === "string" && likeToRegExp(String(filter.value)).test(cell);
  }
}

/** Keeps only the requested columns, the way a PostgREST projection does. */
function project(row: Row, columns: string[] | null): Row {
  if (!columns) return structuredClone(row);
  const out: Row = {};
  for (const column of columns) {
    if (column in row) out[column] = structuredClone(row[column]);
  }
  return out;
}

function parseColumns(select: string | undefined): string[] | null {
  const trimmed = (select ?? "*").trim();
  if (trimmed === "" || trimmed === "*") return null;
  if (trimmed.includes("(")) {
    throw new Error(`Embedded selects are not supported by the local data client: "${trimmed}"`);
  }
  return trimmed
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

class LocalQuery implements PromiseLike<QueryResult> {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private columns: string[] | null = null;
  private rangeFrom = 0;
  private rangeTo = Number.POSITIVE_INFINITY;
  private error: QueryError | null;
  private readonly rowsOfTable: Row[];

  constructor(table: string) {
    const known = Object.prototype.hasOwnProperty.call(TABLES, table);
    this.error = known ? null : { message: `Unknown table "${table}" in the local data client` };
    this.rowsOfTable = known ? TABLES[table] : [];
  }

  select(columns?: string) {
    try {
      this.columns = parseColumns(columns);
    } catch (error) {
      this.error ??= { message: (error as Error).message };
    }
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ op: "eq", column, value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ op: "neq", column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ op: "in", column, value: values });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ op: "gt", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ op: "gte", column, value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ op: "lt", column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ op: "lte", column, value });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ op: "ilike", column, value: pattern });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ op: "is", column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.rangeFrom = 0;
    this.rangeTo = count - 1;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  private run(): { rows: Row[]; error: QueryError | null } {
    if (this.error) return { rows: [], error: this.error };
    let matched = this.rowsOfTable.filter((row) => this.filters.every((filter) => matches(row, filter)));
    // Multi-column sort: apply the least significant key first, stable sort keeps earlier keys.
    for (const { column, ascending } of [...this.orderBy].reverse()) {
      matched = [...matched].sort((a, b) => {
        const cmp = compareValues(a[column], b[column]);
        return ascending ? cmp : -cmp;
      });
    }
    const end = Number.isFinite(this.rangeTo) ? this.rangeTo + 1 : undefined;
    return { rows: matched.slice(this.rangeFrom, end).map((row) => project(row, this.columns)), error: null };
  }

  async single(): Promise<QueryResult> {
    const { rows, error } = this.run();
    if (error) return { data: null, error };
    if (rows.length === 0) return { data: null, error: { code: NO_ROWS_CODE, message: "The result contains 0 rows" } };
    if (rows.length > 1) {
      return { data: null, error: { code: NO_ROWS_CODE, message: "JSON object requested, multiple rows returned" } };
    }
    return { data: rows[0], error: null };
  }

  async maybeSingle(): Promise<QueryResult> {
    const { rows, error } = this.run();
    if (error) return { data: null, error };
    if (rows.length > 1) {
      return { data: null, error: { code: NO_ROWS_CODE, message: "JSON object requested, multiple rows returned" } };
    }
    return { data: rows[0] ?? null, error: null };
  }

  then<A = ListResult, B = never>(
    onfulfilled?: ((value: ListResult) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    const { rows, error } = this.run();
    return Promise.resolve({ data: error ? null : rows, error }).then(onfulfilled, onrejected);
  }
}

export type LocalSupabaseClient = {
  from(table: string): LocalQuery;
};

/**
 * True when the local data snapshot is available. The data ships with the
 * repo, so this is always true. modules/content/server/content.ts keeps the check so its callers
 * do not change.
 */
export function hasPublicSupabaseConfig(): boolean {
  return true;
}

let _publicClient: LocalSupabaseClient | null = null;

/** Read-only client over data/*.json. No network, no environment variables. */
export function publicSupabaseClient(): LocalSupabaseClient {
  if (!_publicClient) {
    _publicClient = { from: (table: string) => new LocalQuery(table) };
  }
  return _publicClient;
}
