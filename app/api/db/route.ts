import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

type Filter = { col: string; op: "eq" | "in"; val: unknown };
type Order = { col: string; ascending: boolean };

function sanitizeCol(col: string): string {
  return col.replace(/[^a-zA-Z0-9_]/g, "");
}

function sanitizeTable(table: string): string {
  return table.replace(/[^a-zA-Z0-9_]/g, "");
}

function buildWhere(filters: Filter[], params: unknown[], offset: number): string {
  if (!filters || filters.length === 0) return "";
  const parts = filters.map((f) => {
    const col = sanitizeCol(f.col);
    if (f.op === "in") {
      const arr = Array.isArray(f.val) ? f.val : [f.val];
      const placeholders = arr.map((_, i) => `$${offset + params.length + i + 1}`);
      arr.forEach((v) => params.push(v));
      return `${col} = ANY(ARRAY[${placeholders.join(",")}])`;
    } else {
      params.push(f.val);
      return `${col} = $${offset + params.length}`;
    }
  });
  return "WHERE " + parts.join(" AND ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table: rawTable, op, data, filters = [], order, limit, select, opts } = body;
    const table = sanitizeTable(rawTable);

    let sql = "";
    const params: unknown[] = [];

    if (op === "select") {
      const cols = select === "*" || !select ? "*" : select.split(",").map((c: string) => sanitizeCol(c.trim())).join(", ");
      sql = `SELECT ${cols} FROM ${table}`;
      const where = buildWhere(filters, params, 0);
      if (where) sql += " " + where;
      if (order) sql += ` ORDER BY ${sanitizeCol(order.col)} ${order.ascending ? "ASC" : "DESC"}`;
      if (limit) sql += ` LIMIT ${parseInt(limit, 10)}`;
      const result = await query(sql, params);
      return NextResponse.json({ data: result.rows, error: null });
    }

    if (op === "insert") {
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) return NextResponse.json({ data: [], error: null });
      const cols = Object.keys(rows[0]).map(sanitizeCol);
      const valueSets = rows.map((row: Record<string, unknown>) => {
        const vals = Object.values(row);
        const placeholders = vals.map((_, i) => `$${params.length + i + 1}`);
        vals.forEach((v) => params.push(v));
        return `(${placeholders.join(", ")})`;
      });
      sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${valueSets.join(", ")} RETURNING *`;
      const result = await query(sql, params);
      return NextResponse.json({ data: result.rows, error: null });
    }

    if (op === "upsert") {
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) return NextResponse.json({ data: [], error: null });
      const cols = Object.keys(rows[0]).map(sanitizeCol);
      const valueSets = rows.map((row: Record<string, unknown>) => {
        const vals = Object.values(row);
        const placeholders = vals.map((_, i) => `$${params.length + i + 1}`);
        vals.forEach((v) => params.push(v));
        return `(${placeholders.join(", ")})`;
      });
      const conflict = opts?.onConflict
        ? opts.onConflict.split(",").map((c: string) => sanitizeCol(c.trim())).join(", ")
        : "id";
      const updateCols = cols.filter((c) => c !== "id");
      const updateStr = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(", ");
      sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${valueSets.join(", ")} ON CONFLICT (${conflict}) DO UPDATE SET ${updateStr} RETURNING *`;
      const result = await query(sql, params);
      return NextResponse.json({ data: result.rows, error: null });
    }

    if (op === "update") {
      const keys = Object.keys(data).map(sanitizeCol);
      const values = Object.values(data);
      values.forEach((v) => params.push(v));
      const setStr = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      sql = `UPDATE ${table} SET ${setStr}`;
      const where = buildWhere(filters, params, keys.length);
      if (where) sql += " " + where;
      sql += " RETURNING *";
      const result = await query(sql, params);
      return NextResponse.json({ data: result.rows, error: null });
    }

    if (op === "delete") {
      sql = `DELETE FROM ${table}`;
      const where = buildWhere(filters, params, 0);
      if (where) sql += " " + where;
      const result = await query(sql, params);
      return NextResponse.json({ data: result.rows, error: null });
    }

    return NextResponse.json({ data: null, error: { message: `Unknown op: ${op}` } }, { status: 400 });
  } catch (e) {
    console.error("[/api/db]", e);
    return NextResponse.json({ data: null, error: { message: (e as Error).message } }, { status: 500 });
  }
}
