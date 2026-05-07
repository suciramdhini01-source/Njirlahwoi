"use client";

const SESSION_KEY = "nj_session_id_v1";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Thin fetch-based client that mirrors the Supabase JS API surface used in this project.
// All calls go through Next.js API routes which talk to Replit PostgreSQL.

type FilterBuilder = {
  eq: (col: string, val: unknown) => FilterBuilder;
  in: (col: string, vals: unknown[]) => FilterBuilder;
  order: (col: string, opts?: { ascending?: boolean }) => FilterBuilder;
  limit: (n: number) => FilterBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  then: (resolve: (v: { data: unknown; error: unknown }) => void) => void;
};

type SelectBuilder = FilterBuilder & {
  select: (cols?: string) => SelectBuilder;
};

function buildQuery(table: string, op: string, payload: Record<string, unknown>): Promise<{ data: unknown; error: unknown }> {
  return fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, op, ...payload }),
  })
    .then((r) => r.json())
    .catch((e) => ({ data: null, error: { message: e.message } }));
}

class Builder {
  private _table: string;
  private _op: string;
  private _payload: Record<string, unknown>;
  private _filters: { col: string; op: string; val: unknown }[] = [];
  private _order?: { col: string; ascending: boolean };
  private _limit?: number;
  private _select?: string;

  constructor(table: string, op: string, payload: Record<string, unknown>) {
    this._table = table;
    this._op = op;
    this._payload = payload;
  }

  select(cols = "*") {
    this._select = cols;
    return this;
  }

  eq(col: string, val: unknown) {
    this._filters.push({ col, op: "eq", val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this._filters.push({ col, op: "in", val: vals });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._order = { col, ascending: opts?.ascending !== false };
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  maybeSingle() {
    this._limit = 1;
    return this._run().then((r) => {
      const arr = Array.isArray(r.data) ? r.data : [];
      return { data: arr[0] ?? null, error: r.error };
    });
  }

  then(resolve: (v: { data: unknown; error: unknown }) => void, reject?: (e: unknown) => void) {
    this._run().then(resolve).catch(reject ?? (() => {}));
  }

  private _run() {
    return buildQuery(this._table, this._op, {
      ...this._payload,
      filters: this._filters,
      order: this._order,
      limit: this._limit,
      select: this._select,
    });
  }
}

function makeTable(table: string) {
  return {
    select(cols = "*") {
      return new Builder(table, "select", {}).select(cols);
    },
    insert(data: unknown) {
      return new Builder(table, "insert", { data });
    },
    upsert(data: unknown, opts?: unknown) {
      return new Builder(table, "upsert", { data, opts });
    },
    update(data: unknown) {
      return new Builder(table, "update", { data });
    },
    delete() {
      return new Builder(table, "delete", {});
    },
  };
}

export const supabase = {
  from: (table: string) => makeTable(table),
};
