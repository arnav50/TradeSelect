import { z } from "zod";

const BASE = "/api";

export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error("Schema mismatch for", path, parsed.error.format());
    throw new Error(`Response shape mismatch on ${path}`);
  }
  return parsed.data;
}
