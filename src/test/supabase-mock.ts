import { vi } from "vitest";

type QueryResult = {
  data?: unknown;
  error?: unknown;
};

export type SupabaseQueryBuilder = {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: Promise<QueryResult>["then"];
  update: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

export function createQueryBuilder(result: QueryResult = {}) {
  const builder = {} as SupabaseQueryBuilder;

  builder.delete = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.ilike = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.upsert = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(async () => ({
    data: result.data ?? null,
    error: result.error ?? null,
  }));
  builder.single = vi.fn(async () => ({
    data: result.data ?? null,
    error: result.error ?? null,
  }));
  builder.then = ((onFulfilled, onRejected) =>
    Promise.resolve({
      data: result.data ?? null,
      error: result.error ?? null,
    }).then(onFulfilled, onRejected)) as Promise<QueryResult>["then"];

  return builder;
}

export function createSupabaseMock(
  tableResults: Record<string, QueryResult | QueryResult[]>
) {
  const buildersByTable = new Map<string, SupabaseQueryBuilder[]>();
  const from = vi.fn((table: string) => {
    const tableResult = tableResults[table] ?? {};
    const queue = Array.isArray(tableResult) ? tableResult : [tableResult];
    const usedBuilders = buildersByTable.get(table) ?? [];
    const result = queue[Math.min(usedBuilders.length, queue.length - 1)] ?? {};
    const builder = createQueryBuilder(result);

    usedBuilders.push(builder);
    buildersByTable.set(table, usedBuilders);

    return builder;
  });

  return {
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
        getUserById: vi.fn(),
        updateUserById: vi.fn(),
      },
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    buildersByTable,
    from,
    rpc: vi.fn(),
  };
}
