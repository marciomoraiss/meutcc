import { getSessionContext } from "../_lib/session";

export const dynamic = "force-dynamic";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const BUCKET = "tcc-files";
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function safeName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "arquivo";
}

export async function POST(request: Request) {
  const context = await getSessionContext(request);
  if (!context) return Response.json({ error: "Autenticação necessária" }, { status: 401 });
  const { supabase, user } = context;
  const { data: tcc } = await supabase.from("tccs").select("id").eq("student_id", user.id).maybeSingle();
  if (!tcc) return Response.json({ error: "TCC não encontrado" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Arquivo obrigatório" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error: "Envie PDF, DOC ou DOCX" }, { status: 415 });
  if (file.size > MAX_FILE_SIZE) return Response.json({ error: "Arquivo maior que 20 MB" }, { status: 413 });
  const key = `${user.id}/${tcc.id}/${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, { contentType: file.type, upsert: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ key, name: file.name, size: file.size, type: file.type }, { status: 201 });
}

export async function GET(request: Request) {
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  const headers = { "Cache-Control": "private, no-store", Vary: "Accept, Authorization" };
  const fail = (message: string, status: number) => wantsJson
    ? Response.json({ error: message }, { status, headers })
    : new Response(message, { status, headers });
  const context = await getSessionContext(request);
  if (!context) return fail("Autenticação necessária. Entre novamente.", 401);
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return fail("Arquivo não informado", 400);
  const { data, error } = await context.supabase.storage.from(BUCKET).createSignedUrl(key, 60);
  if (error || !data?.signedUrl) return fail("Arquivo não encontrado ou acesso não permitido", 404);
  if (wantsJson) return Response.json({ signedUrl: data.signedUrl }, { headers });
  return new Response(null, { status: 302, headers: { ...headers, Location: data.signedUrl } });
}
