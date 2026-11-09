// Copia de seguridad semanal: guarda cada tabla como CSV en el bucket privado "respaldos".
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const TABLAS = ["tiendas","config","perfiles","clientes","transacciones","ediciones","premios","solicitudes",
  "sellos","cupones","mensajes","mensajes_destinatarios","presupuestos","resultados_manuales","pin_cambios"];
const CONSERVAR_SEMANAS = 12;

function csv(filas: Record<string, unknown>[]): string {
  if (!filas.length) return "";
  const cols = Object.keys(filas[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return "﻿" + [cols.join(","), ...filas.map((f) => cols.map((c) => esc(f[c])).join(","))].join("\n");
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cfg } = await sb.rpc("push_config");
  if (!cfg || req.headers.get("x-push-secret") !== cfg.push_secret) return new Response("no", { status: 401 });

  const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); // hora Colombia
  const resumen: Record<string, number | string> = {};
  for (const t of TABLAS) {
    const filas: Record<string, unknown>[] = [];
    for (let i = 0; ; i += 1000) {
      const { data, error } = await sb.from(t).select("*").range(i, i + 999);
      if (error) { resumen[t] = "error: " + error.message; break; }
      filas.push(...data);
      if (data.length < 1000) break;
    }
    if (typeof resumen[t] === "string") continue;
    const { error } = await sb.storage.from("respaldos").upload(`${hoy}/${t}.csv`,
      new Blob([csv(filas)], { type: "text/csv" }), { upsert: true, contentType: "text/csv; charset=utf-8" });
    resumen[t] = error ? "error: " + error.message : filas.length;
  }

  // Borra copias de más de 12 semanas
  const { data: carpetas } = await sb.storage.from("respaldos").list("", { limit: 200 });
  const limite = new Date(Date.now() - CONSERVAR_SEMANAS * 7 * 864e5).toISOString().slice(0, 10);
  for (const c of carpetas || []) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(c.name) && c.name < limite) {
      const { data: fs } = await sb.storage.from("respaldos").list(c.name);
      if (fs?.length) await sb.storage.from("respaldos").remove(fs.map((f) => `${c.name}/${f.name}`));
    }
  }
  return Response.json({ fecha: hoy, resumen });
});
