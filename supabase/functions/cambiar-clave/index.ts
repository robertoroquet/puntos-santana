// El administrador (ya verificado con su código) cambia la contraseña de una cuenta del personal.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const resp = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") || "";
  const comoUsuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: esAdmin } = await comoUsuario.rpc("es_admin");
  if (esAdmin !== true) return resp({ error: "NO_AUTORIZADO" }, 403);

  const { usuario_id, clave } = await req.json().catch(() => ({}));
  if (typeof clave !== "string" || clave.length < 8) return resp({ error: "La contraseña debe tener mínimo 8 caracteres." }, 400);
  const adm = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: p } = await adm.from("perfiles").select("user_id").eq("user_id", usuario_id).maybeSingle();
  if (!p) return resp({ error: "Cuenta no encontrada." }, 404);
  const { error } = await adm.auth.admin.updateUserById(usuario_id, { password: clave });
  if (error) return resp({ error: error.message }, 400);
  return resp({ ok: true });
});
