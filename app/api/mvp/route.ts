import { getSessionContext, type SessionContext } from "../_lib/session";

export const dynamic = "force-dynamic";

const TERM = "2026.2";
const JOIN_CODE = "TCCII-2026";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro inesperado";
}

function rowError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function mapDelivery(row: Record<string, unknown>) {
  return {
    id: row.id, tccId: row.tcc_id, kind: row.kind, version: row.version, status: row.status,
    dueAt: row.due_at, fileKey: row.file_path, fileName: row.file_name,
    studentNote: row.student_note, advisorNote: row.advisor_note, createdAt: row.created_at,
  };
}

async function ensureAdvisorCohort(context: SessionContext, profile: Record<string, unknown>) {
  if (profile.role !== "advisor") return;
  const { error } = await context.supabase.from("cohorts").upsert({
    name: "TCC II — Direito — Turma A", course: "Direito", term: TERM,
    advisor_id: context.user.id, join_code: JOIN_CODE, chapter_days: 15, weekly_limit: 6, absent_days: 15,
  }, { onConflict: "advisor_id,term", ignoreDuplicates: true });
  rowError(error);
}

async function buildPayload(context: SessionContext) {
  const { supabase, user } = context;
  const profileResult = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  rowError(profileResult.error);
  const profile = profileResult.data as Record<string, unknown> | null;
  if (!profile) return { needsJoin: true, email: user.email };
  await ensureAdvisorCohort(context, profile);

  let cohort: Record<string, unknown> | null = null;
  if (profile.role === "advisor") {
    const result = await supabase.from("cohorts").select("*").eq("advisor_id", user.id).eq("term", TERM).maybeSingle();
    rowError(result.error);
    cohort = result.data;
  } else {
    const result = await supabase.from("enrollments").select("cohorts(*)").eq("student_id", user.id).limit(1).maybeSingle();
    rowError(result.error);
    const nested = result.data?.cohorts;
    cohort = (Array.isArray(nested) ? nested[0] : nested) as Record<string, unknown> | null;
  }
  if (!cohort) return { needsJoin: true, email: user.email, profile: { id: profile.id, email: profile.email, name: profile.name, role: profile.role } };

  const tccResult = await supabase.from("tccs")
    .select("*, profiles!tccs_student_id_fkey(name,email)")
    .eq("cohort_id", cohort.id).order("created_at", { ascending: true });
  rowError(tccResult.error);
  const tccRows = (tccResult.data ?? []) as Array<Record<string, unknown>>;
  const ownTcc = profile.role === "student" ? tccRows.find((row) => row.student_id === user.id) : null;
  const focusTcc = ownTcc ?? tccRows[0] ?? null;

  const [deliveryResult, appointmentResult, messageResult, referenceResult] = await Promise.all([
    focusTcc ? supabase.from("deliveries").select("*").eq("tcc_id", focusTcc.id).order("id") : Promise.resolve({ data: [], error: null }),
    supabase.from("appointments").select("*, profiles!appointments_student_id_fkey(name,email)").eq("cohort_id", cohort.id).eq("status", "confirmado").order("starts_at"),
    focusTcc ? supabase.from("messages").select("*, profiles!messages_author_id_fkey(name,role)").eq("tcc_id", focusTcc.id).order("created_at") : Promise.resolve({ data: [], error: null }),
    focusTcc ? supabase.from("references").select("*").eq("tcc_id", focusTcc.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);
  rowError(deliveryResult.error); rowError(appointmentResult.error); rowError(messageResult.error); rowError(referenceResult.error);

  return {
    needsJoin: false,
    profile: { id: profile.id, email: profile.email, name: profile.name, role: profile.role },
    cohort: {
      id: cohort.id, name: cohort.name, course: cohort.course, term: cohort.term,
      weeklyLimit: cohort.weekly_limit, joinCode: profile.role === "advisor" ? cohort.join_code : undefined,
    },
    students: tccRows.map((row) => {
      const person = row.profiles as Record<string, unknown> | null;
      return { id: row.id, studentId: row.student_id, studentEmail: person?.email, name: person?.name, currentStage: row.current_stage, progress: row.progress, area: row.area, theme: row.theme };
    }),
    focusTcc: focusTcc ? { id: focusTcc.id, studentId: focusTcc.student_id, currentStage: focusTcc.current_stage, progress: focusTcc.progress, theme: focusTcc.theme, area: focusTcc.area } : null,
    deliveries: (deliveryResult.data ?? []).map((row) => mapDelivery(row as Record<string, unknown>)),
    appointments: (appointmentResult.data ?? []).map((row) => {
      const person = row.profiles as Record<string, unknown> | null;
      return { id: row.id, studentId: row.student_id, studentEmail: person?.email, startsAt: row.starts_at, status: row.status };
    }),
    messages: (messageResult.data ?? []).map((row) => {
      const author = row.profiles as Record<string, unknown> | null;
      return { id: row.id, authorName: author?.name, authorRole: author?.role === "advisor" ? "Orientador" : "Aluna", body: row.body, createdAt: row.created_at, readAt: row.read_at };
    }),
    references: (referenceResult.data ?? []).map((row) => ({ id: row.id, type: row.type, title: row.title, note: row.note })),
  };
}

export async function GET(request: Request) {
  try {
    const context = await getSessionContext(request);
    if (!context) return Response.json({ error: "Autenticação necessária" }, { status: 401 });
    return Response.json(await buildPayload(context));
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getSessionContext(request);
    if (!context) return Response.json({ error: "Autenticação necessária" }, { status: 401 });
    const { supabase, user } = context;
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "join") {
      const { error } = await supabase.rpc("join_cohort", { p_code: String(body.code ?? "") });
      rowError(error);
      return Response.json(await buildPayload(context));
    }

    const payload = await buildPayload(context) as {
      profile?: { id: string; role: "advisor" | "student" };
      cohort?: { id: string; weeklyLimit: number };
      focusTcc?: { id: number; studentId: string } | null;
      appointments?: Array<{ id: number; studentId: string }>;
    };
    if (!payload.profile || !payload.cohort || !payload.focusTcc) return Response.json({ error: "TCC não encontrado" }, { status: 404 });

    if (action === "message") {
      const text = String(body.text ?? "").trim();
      if (!text) return Response.json({ error: "Mensagem vazia" }, { status: 400 });
      rowError((await supabase.from("messages").insert({ tcc_id: payload.focusTcc.id, author_id: user.id, topic: String(body.topic ?? "Orientações gerais"), body: text, file_path: body.fileKey || null, file_name: body.fileName || null })).error);
    } else if (action === "review") {
      if (payload.profile.role !== "advisor") return Response.json({ error: "Apenas o orientador pode avaliar" }, { status: 403 });
      const status = String(body.status ?? "");
      if (!["Aprovado", "Requer ajustes"].includes(status)) return Response.json({ error: "Status inválido" }, { status: 400 });
      const latest = await supabase.from("deliveries").select("id").eq("tcc_id", payload.focusTcc.id).eq("kind", "Capítulo 2").order("version", { ascending: false }).limit(1).maybeSingle();
      rowError(latest.error);
      if (!latest.data) return Response.json({ error: "Entrega não encontrada" }, { status: 404 });
      rowError((await supabase.from("deliveries").update({ status, advisor_note: String(body.note ?? ""), reviewed_at: new Date().toISOString() }).eq("id", latest.data.id)).error);
      if (status === "Aprovado") rowError((await supabase.from("tccs").update({ progress: 70, current_stage: "Marco 2 · Capítulo 3", last_contact_at: new Date().toISOString() }).eq("id", payload.focusTcc.id)).error);
    } else if (action === "submit") {
      if (payload.profile.role !== "student") return Response.json({ error: "Apenas o aluno pode enviar entregas" }, { status: 403 });
      const kind = String(body.kind ?? "Capítulo 3");
      const versions = await supabase.from("deliveries").select("version").eq("tcc_id", payload.focusTcc.id).eq("kind", kind).order("version", { ascending: false }).limit(1);
      rowError(versions.error);
      const nextVersion = Number(versions.data?.[0]?.version ?? 0) + 1;
      rowError((await supabase.from("deliveries").insert({ tcc_id: payload.focusTcc.id, kind, version: nextVersion, status: "Em análise", due_at: new Date(Date.now() + 15 * 86400000).toISOString(), file_path: String(body.fileKey ?? ""), file_name: String(body.fileName ?? ""), student_note: String(body.note ?? "") })).error);
    } else if (action === "book") {
      const studentId = payload.profile.role === "advisor" ? String(body.studentId ?? payload.focusTcc.studentId) : user.id;
      rowError((await supabase.from("appointments").insert({ cohort_id: payload.cohort.id, student_id: studentId, week_start: new Date().toISOString().slice(0, 10), weekly_position: 1, starts_at: String(body.startsAt ?? ""), subject: String(body.subject ?? "Orientação de TCC") })).error);
    } else if (action === "cancel") {
      const target = (payload.appointments ?? []).find((item) => item.id === Number(body.id));
      if (!target || (payload.profile.role !== "advisor" && target.studentId !== user.id)) return Response.json({ error: "Agendamento não encontrado" }, { status: 404 });
      rowError((await supabase.from("appointments").update({ status: "cancelado" }).eq("id", target.id)).error);
    } else if (action === "reference") {
      if (payload.profile.role !== "advisor") return Response.json({ error: "Apenas o orientador pode indicar referências" }, { status: 403 });
      const title = String(body.title ?? "").trim();
      if (!title) return Response.json({ error: "Título obrigatório" }, { status: 400 });
      rowError((await supabase.from("references").insert({ tcc_id: payload.focusTcc.id, type: String(body.type ?? "Livro"), title, note: String(body.note ?? ""), topic: String(body.topic ?? "Orientações gerais"), created_by: user.id })).error);
    } else {
      return Response.json({ error: "Ação inválida" }, { status: 400 });
    }

    return Response.json(await buildPayload(context));
  } catch (error) {
    const message = errorMessage(error);
    return Response.json({ error: message }, { status: message.toLowerCase().includes("semana") || message.toLowerCase().includes("teto") ? 409 : 500 });
  }
}
