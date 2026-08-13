"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

type Role = "advisor" | "student";
type Page = "dashboard" | "classroom" | "student" | "schedule" | "mentoring";
type Message = { author: string; role: string; text: string; time: string; read: string };
type MvpData = {
  needsJoin: boolean;
  email?: string;
  profile?: { id: string; email: string; name: string; role: Role };
  cohort?: { id: string; name: string; course: string; term: string; weeklyLimit: number };
  students?: Array<{ id: number; studentId: string; studentEmail: string; name: string; currentStage: string; progress: number; area: string; theme: string }>;
  focusTcc?: { id: number; studentId: string; currentStage: string; progress: number; theme: string; area: string };
  deliveries?: Array<{ id: number; kind: string; version: number; status: string; dueAt: string | null; fileKey: string | null; fileName: string | null }>;
  appointments?: Array<{ id: number; studentId: string; studentEmail: string; startsAt: string; status: string }>;
  messages?: Array<{ id: number; authorName: string; authorRole: string; body: string; createdAt: string; readAt: string | null }>;
  references?: Array<{ id: number; type: string; title: string; note: string | null }>;
  invitations?: Array<{ id: number; email: string; name: string; studentNumber: string | null; theme: string; area: string; status: "pending" | "claimed" }>;
};

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [bookedCount, setBookedCount] = useState(0);
  const [studentBooking, setStudentBooking] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState("Pendente");
  const [reviewStatus, setReviewStatus] = useState("Em análise");
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState("Orientações gerais");
  const [toast, setToast] = useState("");
  const [mvp, setMvp] = useState<MvpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const syncMvp = useCallback((data: MvpData) => {
    setMvp(data);
    if (data.profile) setRole(data.profile.role);
    const appointments = data.appointments ?? [];
    setBookedCount(appointments.length);
    const ownAppointment = appointments.find((item) => item.studentEmail === data.profile?.email);
    setStudentBooking(ownAppointment?.startsAt ?? null);
    const latestDelivery = [...(data.deliveries ?? [])].reverse()[0];
    if (latestDelivery) {
      setDeliveryStatus(latestDelivery.status);
      setReviewStatus(latestDelivery.status);
    }
    if (data.messages) setMessages(data.messages.map((item) => ({ author: item.authorName, role: item.authorRole, text: item.body, time: new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }), read: item.readAt ? "lida" : "enviada" })));
  }, []);

  const loadMvp = useCallback(async (token: string) => {
    const response = await fetch("/api/mvp", { cache: "no-store", headers: { authorization: `Bearer ${token}` } });
    const data = await response.json() as MvpData & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Não foi possível abrir o MEUTCC");
    syncMvp(data);
  }, [syncMvp]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const token = data.session?.access_token ?? null;
      setAccessToken(token);
      if (token) {
        try { await loadMvp(token); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao carregar"); }
      }
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAccessToken(session?.access_token ?? null);
      if (!session) { setRole(null); setMvp(null); setLoading(false); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadMvp, notify]);

  const postAction = async (payload: Record<string, unknown>) => {
    if (!accessToken) throw new Error("Autenticação necessária");
    const response = await fetch("/api/mvp", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
    const data = await response.json() as MvpData & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Não foi possível concluir a ação");
    syncMvp(data);
    return data;
  };

  if (loading) return <main className="loading-page"><span className="brand-mark">M</span><strong>Preparando seu MEUTCC…</strong></main>;
  if (!accessToken) return <AuthPage toast={toast} notify={notify} />;
  if (mvp?.needsJoin) return <AwaitingAssignment email={mvp.email ?? ""} toast={toast} />;
  if (!role) return <AuthPage toast={toast} notify={notify} />;

  const profileName = mvp?.profile?.name ?? (role === "advisor" ? "Orientador" : "Aluno");
  const initials = profileName.split(" ").filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase();

  const nav = role === "advisor"
    ? [["dashboard", "Visão geral"], ["classroom", "Turma"], ["student", "Ficha do aluno"], ["schedule", "Agendamento"], ["mentoring", "Mentoria"]]
    : [["dashboard", "Início"], ["student", "Meu TCC"], ["schedule", "Agenda"], ["mentoring", "Mentoria"]];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage("dashboard")}><span className="brand-mark">M</span><span>MEUTCC</span></button>
        <div className="profile-mini"><span className="avatar">{initials}</span><span><strong>{profileName}</strong><small>{role === "advisor" ? "Orientador" : "Aluno"}</small></span></div>
        <nav className="side-nav" aria-label="Navegação principal">
          {nav.map(([key, label]) => <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key as Page)}>{label}</button>)}
        </nav>
        <div className="sidebar-foot"><span className="session-note">Sessão protegida</span><button className="text-button" onClick={async () => { await getSupabaseBrowserClient().auth.signOut(); }}>Sair</button></div>
      </aside>

      <section className="workspace">
        <header className="mobile-head"><button className="brand" onClick={() => setPage("dashboard")}><span className="brand-mark">M</span><span>MEUTCC</span></button><select value={page} onChange={(e) => setPage(e.target.value as Page)} aria-label="Selecionar tela">{nav.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></header>
        <div className="content">
          {role === "advisor" && page === "dashboard" && <AdvisorDashboard onOpenStudent={() => setPage("student")} onSchedule={() => setPage("schedule")} onOpenClassroom={() => setPage("classroom")} bookedCount={bookedCount} liveStudents={mvp?.students ?? []} appointments={mvp?.appointments ?? []} invitations={mvp?.invitations ?? []} />}
          {role === "advisor" && page === "classroom" && <Classroom notify={notify} students={mvp?.students ?? []} invitations={mvp?.invitations ?? []} onImport={async (students) => { await postAction({ action: "import_students", students }); }} />}
          {role === "advisor" && page === "student" && (mvp?.focusTcc ? <StudentRecord reviewStatus={reviewStatus} setReviewStatus={async (value, note) => { try { await postAction({ action: "review", status: value, note }); notify(value === "Aprovado" ? "Entrega aprovada e progresso atualizado." : "Ajustes enviados ao aluno com novo prazo."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao avaliar"); } }} onMentoring={() => setPage("mentoring")} deliveries={mvp?.deliveries} student={mvp.students?.[0]} /> : <EmptyState title="Nenhum aluno vinculado" text="Importe a lista da sua orientação quando a distribuição de orientadores estiver concluída." action="Abrir cadastro da turma" onAction={() => setPage("classroom")} />)}
          {role === "student" && page === "dashboard" && <StudentDashboard name={profileName} progress={mvp?.focusTcc?.progress ?? 0} deliveryStatus={deliveryStatus} submitDelivery={async (file, note, kind) => { try { const form = new FormData(); form.append("file", file); const uploadedResponse = await fetch("/api/files", { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body: form }); const uploaded = await uploadedResponse.json() as { error?: string; key?: string; name?: string }; if (!uploadedResponse.ok || !uploaded.key) throw new Error(uploaded.error ?? "Erro no envio"); await postAction({ action: "submit", kind, fileKey: uploaded.key, fileName: uploaded.name, note }); notify("Entrega enviada. O orientador foi notificado."); } catch (error) { notify(error instanceof Error ? error.message : "Erro no envio"); } }} onSchedule={() => setPage("schedule")} onMentoring={() => setPage("mentoring")} />}
          {role === "student" && page === "student" && <MyTcc deliveryStatus={deliveryStatus} tcc={mvp?.focusTcc} />}
          {page === "schedule" && (role === "advisor" && !mvp?.students?.length ? <EmptyState title="Agenda aguardando alunos" text="Os horários poderão ser publicados depois que a lista real estiver vinculada à turma." action="Preparar lista de alunos" onAction={() => setPage("classroom")} /> : <Schedule role={role} bookedCount={bookedCount} studentBooking={studentBooking} onBook={async (slot) => { try { const iso = slot.includes("Seg") ? "2026-08-17T18:40:00-03:00" : slot.includes("Qua") ? "2026-08-19T19:00:00-03:00" : slot.includes("Qui") ? "2026-08-20T18:40:00-03:00" : "2026-08-21T18:10:00-03:00"; await postAction({ action: "book", startsAt: iso, subject: "Orientação de TCC" }); notify("Agendamento confirmado e registrado no histórico."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao agendar"); } }} onCancel={async () => { try { const own = mvp?.appointments?.find((item) => item.studentEmail === mvp.profile?.email); if (own) await postAction({ action: "cancel", id: own.id }); notify("Agendamento cancelado. A vaga foi liberada."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao cancelar"); } }} notify={notify} />)}
          {page === "mentoring" && (role === "advisor" && !mvp?.focusTcc ? <EmptyState title="Mentoria ainda sem conversas" text="O canal será liberado assim que o primeiro aluno acessar a turma." action="Ver alunos pendentes" onAction={() => setPage("classroom")} /> : <Mentoring role={role} studentName={role === "student" ? profileName : mvp?.students?.[0]?.name ?? "aluno selecionado"} messages={messages} topic={topic} setTopic={setTopic} notify={notify} sendPersistent={async (text) => { await postAction({ action: "message", text, topic }); }} references={mvp?.references} />)}
        </div>
      </section>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function AuthPage({ toast, notify }: { toast: string; notify: (message: string) => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!email.includes("@")) return notify("Informe um e-mail válido.");
    setSending(true);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: window.location.origin } });
    setSending(false);
    notify(error ? error.message : "Enviamos um link de acesso para o seu e-mail.");
  };
  return <main className="join-page"><section className="login-panel join-panel"><div className="brand dark-brand"><span className="brand-mark">M</span><span>MEUTCC</span></div><div><span className="eyebrow dark">Acesso protegido</span><h1>Entre com seu e-mail</h1><p>Você receberá um link seguro para acessar seus dados acadêmicos, mensagens e arquivos.</p></div><label><span>E-mail</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seuemail@exemplo.com" onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} /></label><button className="primary sign-in" disabled={sending} onClick={() => void submit()}>{sending ? "Enviando…" : "Enviar link de acesso"}</button><small>O orientador controla quem pode acessar a turma.</small></section>{toast && <div className="toast" role="status">{toast}</div>}</main>;
}

function AwaitingAssignment({ email, toast }: { email: string; toast: string }) {
  return <main className="join-page"><section className="login-panel join-panel"><div className="brand dark-brand"><span className="brand-mark">M</span><span>MEUTCC</span></div><div><span className="eyebrow dark">Aguardando vinculação</span><h1>Seu acesso está confirmado</h1><p>O e-mail <strong>{email}</strong> ainda não aparece na lista de orientação. Assim que a distribuição dos orientadores for importada, sua turma será vinculada automaticamente.</p></div><button className="secondary" onClick={async () => { await getSupabaseBrowserClient().auth.signOut(); }}>Sair</button><small>Você não precisa criar outra conta nem informar código de turma.</small></section>{toast && <div className="toast" role="status">{toast}</div>}</main>;
}

function PageHead({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) { return <div className="page-head"><div><span className="eyebrow dark">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>; }
function Stat({ label, value, note, tone = "navy" }: { label: string; value: string; note: string; tone?: string }) { return <article className={`stat ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function EmptyState({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) { return <section className="panel empty-state"><span className="empty-icon">M</span><h1>{title}</h1><p>{text}</p>{action && onAction && <button className="primary" onClick={onAction}>{action}</button>}</section>; }

function AdvisorDashboard({ onOpenStudent, onSchedule, onOpenClassroom, bookedCount, liveStudents, appointments, invitations }: { onOpenStudent: () => void; onSchedule: () => void; onOpenClassroom: () => void; bookedCount: number; liveStudents: NonNullable<MvpData["students"]>; appointments: NonNullable<MvpData["appointments"]>; invitations: NonNullable<MvpData["invitations"]> }) {
  const pending = invitations.filter((item) => item.status === "pending").length;
  const areaCounts = liveStudents.reduce<Record<string, number>>((result, student) => { result[student.area] = (result[student.area] ?? 0) + 1; return result; }, {});
  const maxArea = Math.max(1, ...Object.values(areaCounts));
  return <><PageHead eyebrow="TCC II · Direito · 2026.2" title="Painel do orientador" text={liveStudents.length ? "Acompanhe o progresso real da sua turma." : "A turma está pronta para receber a lista de orientandos."} action={<button className="primary" onClick={liveStudents.length ? onSchedule : onOpenClassroom}>{liveStudents.length ? "Abrir agenda" : "Cadastrar alunos"}</button>} /><div className="stats"><Stat label="Alunos ativos" value={String(liveStudents.length)} note="Contas já vinculadas" /><Stat label="Aguardando acesso" value={String(pending)} note="Convites importados" tone="red" /><Stat label="Agenda da semana" value={`${bookedCount}/6`} note={bookedCount ? "Atendimentos confirmados" : "Nenhum agendamento"} tone="gold" /></div>{!liveStudents.length && !invitations.length ? <EmptyState title="Aguardando a lista de orientandos" text="Quando receber a distribuição dos orientadores, importe a planilha na área Turma. Até lá, nenhum dado fictício será exibido." action="Abrir cadastro da turma" onAction={onOpenClassroom} /> : <><div className="dashboard-grid"><section className="panel wide"><div className="panel-head"><div><h2>Acompanhamento da turma</h2><p>Somente alunos que já fizeram o primeiro acesso.</p></div></div>{liveStudents.length ? <div className="student-table">{liveStudents.map((student, index) => <button className="student-row" key={student.id} onClick={index === 0 ? onOpenStudent : undefined}><span className="avatar small">{student.name.split(" ").slice(0, 2).map(n => n[0]).join("")}</span><span><strong>{student.name}</strong><small>{student.currentStage}</small></span><span className="status">Em acompanhamento</span><span className="progress-cell"><span className="progress"><i style={{ width: `${student.progress}%` }} /></span><b>{student.progress}%</b></span></button>)}</div> : <p className="inline-empty">Os alunos importados aparecerão aqui depois do primeiro acesso.</p>}</section><aside className="panel"><div className="panel-head"><div><h2>Agenda da semana</h2><p>{bookedCount} de 6 presenciais</p></div></div>{appointments.length ? appointments.map((item) => <div className="agenda-line" key={item.id}><span className="dot" /><span>{new Date(item.startsAt).toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span><small>{liveStudents.find((student) => student.studentEmail === item.studentEmail)?.name ?? item.studentEmail}</small></div>) : <p className="inline-empty">Nenhum agendamento nesta semana.</p>}<button className="secondary block" onClick={onSchedule}>Ver agenda completa</button></aside></div><section className="panel areas"><div className="panel-head"><div><h2>Temas por área</h2><p>Distribuição dos trabalhos cadastrados.</p></div></div>{Object.keys(areaCounts).length ? Object.entries(areaCounts).map(([name, count]) => <div className="area" key={name}><span>{name}</span><span className="bar"><i style={{ width: `${count / maxArea * 100}%` }} /></span><strong>{count}</strong></div>) : <p className="inline-empty">A distribuição será gerada a partir dos temas reais.</p>}</section></>}</>;
}

function Classroom({ notify, students, invitations, onImport }: { notify: (message: string) => void; students: NonNullable<MvpData["students"]>; invitations: NonNullable<MvpData["invitations"]>; onImport: (students: Array<Record<string, string>>) => Promise<void> }) {
  const [step, setStep] = useState(2);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [importing, setImporting] = useState(false);
  const downloadTemplate = () => {
    const content = "nome;email;matricula;tema;area\n";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "modelo-alunos-meutcc.csv"; anchor.click(); URL.revokeObjectURL(url);
  };
  const readFile = async (selected: File | null) => {
    setFile(selected); setPreview([]); if (!selected) return;
    const lines = (await selected.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
    const separator = lines[0]?.includes(";") ? ";" : ",";
    const headers = (lines.shift() ?? "").split(separator).map((value) => value.trim().toLowerCase());
    const required = ["nome", "email"];
    if (!required.every((item) => headers.includes(item))) { notify("A planilha precisa ter as colunas nome e email."); return; }
    const rows = lines.map((line) => { const values = line.split(separator).map((value) => value.trim().replace(/^"|"$/g, "")); const pick = (name: string) => values[headers.indexOf(name)] ?? ""; return { name: pick("nome"), email: pick("email").toLowerCase(), studentNumber: pick("matricula"), theme: pick("tema"), area: pick("area") }; }).filter((row) => row.name || row.email);
    if (!rows.length) { notify("A planilha não contém alunos."); return; }
    if (new Set(rows.map((row) => row.email)).size !== rows.length) { notify("Há e-mails duplicados na planilha."); return; }
    if (rows.some((row) => !row.name || !row.email.includes("@"))) { notify("Revise as linhas sem nome ou e-mail válido."); return; }
    setPreview(rows); notify(`${rows.length} aluno(s) identificado(s). Confira antes de importar.`);
  };
  return <><PageHead eyebrow="Configuração acadêmica" title="Turma TCC II — Direito" text={`${students.length} aluno(s) ativo(s) · ${invitations.filter((item) => item.status === "pending").length} aguardando acesso · período 2026.2`} /><div className="stepper">{["Dados da turma", "Alunos", "Regras"].map((label, i) => <button key={label} className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""} onClick={() => setStep(i + 1)}><span>{i + 1}</span>{label}</button>)}</div><section className="panel form-panel">{step === 1 && <div className="form-grid"><Field label="Nome da turma" value="TCC II — Direito — Turma A" /><Field label="Período" value="2026.2" /><Field label="Curso" value="Direito" /><Field label="Situação" value="Aguardando distribuição dos orientadores" /></div>}{step === 2 && <><div className="import-box"><strong>{invitations.length ? `${invitations.length} aluno(s) importado(s)` : "Lista ainda não importada"}</strong><span>Use o modelo quando receber a relação definitiva dos seus orientandos.</span><div className="import-actions"><button className="secondary" onClick={downloadTemplate}>Baixar modelo</button><label className="primary file-label">Selecionar planilha CSV<input type="file" accept=".csv,text/csv" onChange={(event) => void readFile(event.target.files?.[0] ?? null)} /></label></div>{file && <small>Arquivo selecionado: {file.name}</small>}</div>{preview.length > 0 && <div className="import-preview"><div className="panel-head"><div><h2>Conferência da importação</h2><p>{preview.length} aluno(s) pronto(s) para cadastro.</p></div><button className="primary" disabled={importing} onClick={async () => { try { setImporting(true); await onImport(preview); setPreview([]); setFile(null); notify("Lista importada. Os alunos serão vinculados no primeiro acesso."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao importar"); } finally { setImporting(false); } }}>{importing ? "Importando…" : "Confirmar importação"}</button></div>{preview.slice(0, 5).map((item) => <div className="preview-row" key={item.email}><strong>{item.name}</strong><span>{item.email}</span><small>{item.theme || "Tema em definição"}</small></div>)}{preview.length > 5 && <small>Mais {preview.length - 5} aluno(s) na planilha.</small>}</div>}<div className="simple-list">{invitations.map((item) => <div key={item.id}><span className="avatar small">{item.name.split(" ").map((name) => name[0]).slice(0, 2).join("")}</span><span><strong>{item.name}</strong><small>{item.email} · {item.studentNumber || "matrícula não informada"}</small></span><span className={`status ${item.status === "claimed" ? "aprovado" : ""}`}>{item.status === "claimed" ? "Ativo" : "Aguardando acesso"}</span></div>)}</div></>}{step === 3 && <div className="rule-grid"><Rule title="Prazo padrão" value="15 dias corridos por capítulo" /><Rule title="Teto semanal" value="6 atendimentos presenciais" /><Rule title="Limite individual" value="1 encontro por aluno/semana" /><Rule title="Aluno sem contato" value="Alerta após 15 dias" /><Rule title="Desbloqueio do Marco 3" value="Após aprovação dos capítulos centrais" /><Rule title="Vinculação" value="Automática pelo e-mail importado" /></div>}<div className="form-actions"><button className="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>Voltar</button><button className="primary" onClick={() => step < 3 ? setStep(step + 1) : notify("Regras da turma confirmadas.")}>{step < 3 ? "Continuar" : "Concluir"}</button></div></section></>;
}

function Field({ label, value }: { label: string; value: string }) { return <label><span>{label}</span><input defaultValue={value} /></label>; }
function Rule({ title, value }: { title: string; value: string }) { return <article><span className="rule-icon">✓</span><span><strong>{title}</strong><small>{value}</small></span></article>; }

function StudentRecord({ reviewStatus, setReviewStatus, onMentoring, deliveries, student }: { reviewStatus: string; setReviewStatus: (value: string, note: string) => Promise<void>; onMentoring: () => void; deliveries?: MvpData["deliveries"]; student?: NonNullable<MvpData["students"]>[number] }) {
  const [note, setNote] = useState("");
  const rows = deliveries ?? [];
  const initials = (student?.name ?? "Aluno").split(" ").map((name) => name[0]).slice(0, 2).join("");
  const latest = rows.at(-1);
  return <><PageHead eyebrow="Ficha individual" title={student?.name ?? "Aluno"} text={`${student?.area ?? "Área a definir"} · ${student?.theme ?? "Tema em definição"}`} action={<button className="secondary" onClick={onMentoring}>Abrir mentoria</button>} /><div className="student-summary"><span className="avatar xlarge">{initials}</span><div><span className="eyebrow dark">Progresso geral</span><strong>{student?.progress ?? 0}%</strong><span className="progress large"><i style={{width: `${student?.progress ?? 0}%`}} /></span><small>{student?.currentStage ?? "Marco 1"}</small></div><div><span className="eyebrow dark">Entregas</span><strong>{rows.length}</strong><small>Versões registradas</small></div><div><span className="eyebrow dark">Situação</span><strong>{latest?.status ?? "Iniciando"}</strong><small>Acompanhamento real</small></div></div><div className="record-grid"><section className="panel trail-panel"><h2>Trilha acadêmica</h2><Milestone number="1" title="Marco 1 — Planejamento" text="Tema, problema, objetivos e sumário" status={student?.progress && student.progress >= 20 ? "Concluído" : "Em andamento"} done={Boolean(student?.progress && student.progress >= 20)} current={!student?.progress || student.progress < 20} /><Milestone number="2" title="Marco 2 — Desenvolvimento" text="Capítulos centrais do trabalho" status={student?.progress && student.progress >= 20 ? "Em andamento" : "Bloqueado"} current={Boolean(student?.progress && student.progress >= 20)} /><Milestone number="3" title="Marco 3 — Lapidação final" text="Introdução e conclusão" status="Bloqueado" /></section><aside className="panel review-panel">{latest ? <><span className="eyebrow dark">Analisar entrega</span><h2>{latest.kind} · versão {latest.version}</h2><p>Status atual: {reviewStatus}</p>{latest.fileKey && <a className="file-button" href={`/api/files?key=${encodeURIComponent(latest.fileKey)}`}>Abrir arquivo enviado</a>}<label><span>Parecer</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Registre as orientações para o aluno." /></label><div className="split-actions"><button className="secondary danger" onClick={() => setReviewStatus("Requer ajustes", note)}>Requer ajustes</button><button className="primary" onClick={() => setReviewStatus("Aprovado", note)}>Aprovar</button></div></> : <><span className="eyebrow dark">Entregas</span><h2>Nenhum arquivo recebido</h2><p>Esta área será liberada quando o aluno enviar a primeira versão.</p></>}</aside></div><section className="panel"><div className="panel-head"><div><h2>Versões recebidas</h2><p>O histórico é preservado sem sobrescrita.</p></div></div>{rows.length ? rows.map((version)=><div className="version-row" key={version.id}><span className="doc-icon">DOC</span><span><strong>{version.kind} · v{version.version}</strong><small>{version.fileName ?? "Registro acadêmico"}</small></span><span className={`status ${version.status.toLowerCase().replace(" ", "-")}`}>{version.status}</span></div>) : <p className="inline-empty">Nenhuma versão enviada.</p>}</section></>;
}

function Milestone({ number, title, text, status, done, current }: { number: string; title: string; text: string; status: string; done?: boolean; current?: boolean }) { return <article className={`milestone ${done ? "done" : current ? "current" : "locked"}`}><span className="milestone-node">{done ? "✓" : number}</span><span><strong>{title}</strong><small>{text}</small></span><b>{status}</b></article>; }

function StudentDashboard({ name, progress, deliveryStatus, submitDelivery, onSchedule, onMentoring }: { name: string; progress: number; deliveryStatus: string; submitDelivery: (file: File, note: string, kind: string) => Promise<void>; onSchedule: () => void; onMentoring: () => void }) {
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const kind = progress < 20 ? "Marco 1 — Tema e sumário" : progress < 70 ? "Capítulos centrais" : "Introdução e conclusão";
  const underReview = deliveryStatus === "Em análise";
  return <><PageHead eyebrow="TCC II · Direito" title={`Olá, ${name.split(" ")[0]}`} text="Acompanhe sua próxima ação e o retorno do orientador." /><div className="stats"><Stat label="Progresso geral" value={`${progress}%`} note="Trilha atualizada" /><Stat label="Próxima entrega" value={kind} note="Prazo definido pelo orientador" tone="red" /><Stat label="Próximo encontro" value="Agenda" note="Consulte os horários" tone="gold" /></div><section className="action-card"><div><span className="eyebrow">Sua próxima ação</span><h2>{underReview ? "Entrega enviada" : kind}</h2><p>{underReview ? "A versão está com o orientador. Você receberá um aviso quando houver parecer." : "Envie o documento correspondente à etapa atual quando estiver pronto para avaliação."}</p></div><span className="deadline-card"><small>Status</small><strong>{deliveryStatus}</strong><small>Consulte as orientações recebidas</small></span><button className="light-button" onClick={() => setShowUpload(!showUpload)}>{underReview ? "Enviar nova versão" : "Enviar documento"}</button></section>{showUpload && <section className="panel upload-panel"><h2>{kind}</h2><label className="upload-box"><strong>Selecionar DOCX ou PDF</strong><small>Até 20 MB · o arquivo será armazenado com segurança</small><input type="file" accept=".doc,.docx,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label><span>Mensagem ao orientador</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Acrescente uma observação sobre esta versão." /></label><div className="form-actions"><button className="secondary" onClick={() => setShowUpload(false)}>Cancelar</button><button className="primary" disabled={!file || sending} onClick={async () => { if (!file) return; setSending(true); await submitDelivery(file, note, kind); setSending(false); setShowUpload(false); }}>{sending ? "Enviando…" : "Confirmar envio"}</button></div></section>}<div className="dashboard-grid"><section className="panel trail-panel"><h2>Minha trilha</h2><Milestone number="1" title="Marco 1 — Planejamento" text="Tema, problema, objetivos e sumário" status={progress >= 20 ? "Concluído" : "Em andamento"} done={progress >= 20} current={progress < 20} /><Milestone number="2" title="Marco 2 — Desenvolvimento" text="Capítulos centrais do trabalho" status={progress >= 70 ? "Concluído" : progress >= 20 ? "Em andamento" : "Bloqueado"} done={progress >= 70} current={progress >= 20 && progress < 70} /><Milestone number="3" title="Marco 3 — Lapidação final" text="Introdução e conclusão" status={progress >= 70 ? "Em andamento" : "Bloqueado"} current={progress >= 70} /></section><aside className="panel quick-actions"><h2>Acessos rápidos</h2><button onClick={onSchedule}><span>AGENDA</span><b>Próximo encontro</b><small>Consulte ou reserve um horário</small></button><button onClick={onMentoring}><span>MENTORIA</span><b>Mensagens do orientador</b><small>Dúvidas e referências do TCC</small></button></aside></div></>;
}

function MyTcc({ deliveryStatus, tcc }: { deliveryStatus: string; tcc?: MvpData["focusTcc"] }) {
  const progress = tcc?.progress ?? 0;
  return <><PageHead eyebrow="Meu trabalho" title={tcc?.theme ?? "Tema em definição"} text={`Área: ${tcc?.area ?? "A definir"} · acompanhamento individual`} /><section className="panel trail-panel full"><h2>Trilha completa</h2><Milestone number="1" title="Marco 1 — Planejamento" text="Tema, problema, objetivos e sumário" status={progress >= 20 ? "Concluído" : "Em andamento"} done={progress >= 20} current={progress < 20} /><Milestone number="2" title="Marco 2 — Desenvolvimento" text="Capítulos centrais do trabalho" status={progress >= 70 ? "Concluído" : progress >= 20 ? deliveryStatus : "Bloqueado"} done={progress >= 70} current={progress >= 20 && progress < 70} /><Milestone number="3" title="Marco 3 — Lapidação final" text="Introdução e conclusão liberadas após os capítulos centrais" status={progress >= 70 ? deliveryStatus : "Bloqueado"} current={progress >= 70} /></section></>;
}

function Schedule({ role, bookedCount, studentBooking, onBook, onCancel, notify }: { role: Role; bookedCount: number; studentBooking: string | null; onBook: (slot: string) => void; onCancel: () => void; notify: (message: string) => void }) {
  const slots = ["Seg 17 · 18:40", "Qua 19 · 19:00", "Qui 20 · 18:40", "Sex 21 · 18:10"];
  return <><PageHead eyebrow={role === "advisor" ? "Gestão de horários" : "Orientação presencial"} title={role === "advisor" ? "Agenda de orientações" : "Agendar orientação"} text="Semana de 17 a 21 de agosto de 2026" action={role === "advisor" ? <button className="primary" onClick={() => notify("Configuração de novos horários será disponibilizada no próximo módulo.")}>Abrir horários</button> : undefined} /><div className="stats"><Stat label="Atendimentos presenciais" value={`${bookedCount}/6`} note={bookedCount >= 6 ? "Teto semanal atingido" : `${6-bookedCount} agendamento(s) disponível(is)`} /><Stat label="Horários disponíveis" value={String(Math.max(0, slots.length - bookedCount))} note={`${bookedCount} reservado(s)`} tone="red" /><Stat label={role === "advisor" ? "Próximo atendimento" : "Meu encontro"} value={role === "advisor" ? (bookedCount ? "Confirmado" : "Nenhum") : studentBooking ? "Confirmado" : "Nenhum"} note={role === "advisor" ? "Consulte a lista de agendamentos" : studentBooking ?? "Escolha um horário"} tone="gold" /></div><div className="schedule-grid"><section className="panel"><div className="panel-head"><div><h2>Horários da semana</h2><p>Presencial · duração de 40 minutos</p></div><span className={`capacity ${bookedCount >= 6 ? "full" : ""}`}>{bookedCount >= 6 ? "Agenda completa" : "Vagas abertas"}</span></div><div className="slot-grid">{slots.map(slot => <button key={slot} className={studentBooking === slot ? "slot selected" : "slot"} disabled={role === "student" && (bookedCount >= 6 || !!studentBooking)} onClick={() => role === "student" ? onBook(slot) : notify(`${slot}: horário ainda disponível.`)}><strong>{slot.split(" · ")[1]}</strong><span>{slot.split(" · ")[0]}</span><small>{studentBooking === slot ? "Seu encontro" : "Disponível"}</small></button>)}</div>{role === "student" && studentBooking && <div className="booking-confirm"><span><strong>Encontro confirmado</strong><small>{studentBooking} · local a confirmar</small></span><button className="secondary danger" onClick={onCancel}>Cancelar</button></div>}</section><aside className="panel rules"><h2>Regras automáticas</h2><Rule title="Teto do orientador" value="Até 6 presenciais por semana" /><Rule title="Limite do aluno" value="1 encontro presencial por semana" /><Rule title="Conflito de horário" value="Vaga reservada deixa de aparecer" /><Rule title="Histórico" value="Assunto e presença ficam registrados" /></aside></div></>;
}

function Mentoring({ role, studentName, messages, topic, setTopic, notify, sendPersistent, references }: { role: Role; studentName: string; messages: Message[]; topic: string; setTopic: (topic: string) => void; notify: (message: string) => void; sendPersistent: (text: string) => Promise<void>; references?: MvpData["references"] }) {
  const [text, setText] = useState("");
  const topics = ["Capítulo 2 — Jurisprudência", "Capítulo 3 — Discussão crítica", "Metodologia", "Orientações gerais"];
  const send = async () => { if (!text.trim()) return notify("Escreva uma mensagem antes de enviar."); try { await sendPersistent(text.trim()); setText(""); notify("Mensagem enviada e registrada no histórico."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao enviar"); } };
  const materialRows = references?.map((item) => [item.type.toUpperCase(), item.title]) ?? [];
  return <><PageHead eyebrow="Canal exclusivo do TCC" title="Mentoria assíncrona" text={`Mensagens e referências vinculadas ao trabalho de ${studentName}.`} /><div className="mentoring-grid"><aside className="panel topics"><h2>Assuntos</h2>{topics.map((item)=><button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)}><span><strong>{item.split(" — ")[0]}</strong><small>{item.split(" — ")[1] ?? "Cronograma e dúvidas"}</small></span></button>)}</aside><section className="panel conversation"><div className="panel-head"><div><h2>{topic}</h2><p>Histórico persistente do trabalho</p></div></div><div className="message-list">{messages.length ? messages.map((message,index)=><article className="message" key={`${message.time}${index}`}><span className={`avatar small ${message.role === "Aluna" ? "student" : ""}`}>{message.author.split(" ").map(name=>name[0]).slice(0,2).join("")}</span><span><strong>{message.author} <small>{message.role}</small></strong><p>{message.text}</p><small>{message.time} · {message.read}</small></span></article>) : <p className="inline-empty">Nenhuma mensagem registrada. Inicie a conversa quando necessário.</p>}</div><div className="composer"><textarea value={text} onChange={event=>setText(event.target.value)} placeholder={`Responder como ${role === "advisor" ? "orientador" : "aluno"}...`} /><div><label className="secondary attach">Anexar<input type="file" /></label><button className="primary" onClick={send}>Enviar mensagem</button></div></div></section><aside className="panel materials"><h2>Materiais vinculados</h2>{materialRows.length ? materialRows.map((material)=><div className="material" key={material[1]}><span>{material[0]}</span><strong>{material[1]}</strong><small>Referência registrada</small></div>) : <p className="inline-empty">Nenhuma referência adicionada.</p>}<button className="secondary block" onClick={()=>notify("Use a ficha do aluno para adicionar uma referência.")}>Adicionar referência</button></aside></div></>;
}
