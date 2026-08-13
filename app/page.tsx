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
};

const students = [
  { name: "Ana Clara Ribeiro", stage: "Marco 2 · Cap. 2", action: "Corrigir até 18/08", progress: 65, status: "Em análise" },
  { name: "Bruno Almeida", stage: "Marco 1 · Sumário", action: "Aguardando aluno", progress: 20, status: "Pendente" },
  { name: "Carla Mendes", stage: "Marco 3 · Introdução", action: "Analisar versão", progress: 82, status: "Em análise" },
  { name: "Diego Santos", stage: "Marco 2 · Cap. 1", action: "Atrasado há 4 dias", progress: 35, status: "Atrasado" },
  { name: "Elisa Rocha", stage: "Marco 2 · Cap. 3", action: "Requer ajustes", progress: 58, status: "Ajustes" },
];

const baseMessages: Message[] = [
  { author: "Ana Clara", role: "Aluna", text: "Professor, encontrei dois julgados recentes com entendimentos diferentes. Posso trabalhar essa divergência na análise crítica?", time: "08:46", read: "entregue" },
  { author: "Márcio Morais", role: "Orientador", text: "Sim. Apresente primeiro o ponto comum entre os julgados e depois identifique a divergência de fundamentos.", time: "09:02", read: "lida às 09:14" },
  { author: "Márcio Morais", role: "Orientador", text: "Vincule a discussão ao problema de pesquisa, evitando apenas descrever as decisões.", time: "09:05", read: "lida às 09:14" },
];

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [bookedCount, setBookedCount] = useState(5);
  const [studentBooking, setStudentBooking] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState("Pendente");
  const [reviewStatus, setReviewStatus] = useState("Em análise");
  const [messages, setMessages] = useState<Message[]>(baseMessages);
  const [topic, setTopic] = useState("Capítulo 2 — Jurisprudência");
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
    const cap3 = [...(data.deliveries ?? [])].reverse().find((item) => item.kind === "Capítulo 3");
    if (cap3) setDeliveryStatus(cap3.status);
    const cap2 = [...(data.deliveries ?? [])].reverse().find((item) => item.kind === "Capítulo 2");
    if (cap2) setReviewStatus(cap2.status);
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
  if (mvp?.needsJoin) return <JoinClass email={mvp.email ?? ""} onJoin={async (code) => { try { await postAction({ action: "join", code }); notify("Turma vinculada com sucesso."); } catch (error) { notify(error instanceof Error ? error.message : "Código inválido"); } }} toast={toast} />;
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
          {role === "advisor" && page === "dashboard" && <AdvisorDashboard onOpenStudent={() => setPage("student")} onSchedule={() => setPage("schedule")} bookedCount={bookedCount} reviewStatus={reviewStatus} liveStudents={mvp?.students} />}
          {role === "advisor" && page === "classroom" && <Classroom notify={notify} />}
          {role === "advisor" && page === "student" && <StudentRecord reviewStatus={reviewStatus} setReviewStatus={async (value, note) => { try { await postAction({ action: "review", status: value, note }); notify(value === "Aprovado" ? "Entrega aprovada e progresso atualizado." : "Ajustes enviados à aluna com novo prazo."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao avaliar"); } }} onMentoring={() => setPage("mentoring")} deliveries={mvp?.deliveries} />}
          {role === "student" && page === "dashboard" && <StudentDashboard name={profileName} progress={mvp?.focusTcc?.progress ?? 0} deliveryStatus={deliveryStatus} submitDelivery={async (file, note) => { try { const form = new FormData(); form.append("file", file); const uploadedResponse = await fetch("/api/files", { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body: form }); const uploaded = await uploadedResponse.json() as { error?: string; key?: string; name?: string }; if (!uploadedResponse.ok || !uploaded.key) throw new Error(uploaded.error ?? "Erro no envio"); await postAction({ action: "submit", kind: "Capítulo 3", fileKey: uploaded.key, fileName: uploaded.name, note }); notify("Capítulo enviado. O orientador foi notificado."); } catch (error) { notify(error instanceof Error ? error.message : "Erro no envio"); } }} onSchedule={() => setPage("schedule")} onMentoring={() => setPage("mentoring")} />}
          {role === "student" && page === "student" && <MyTcc deliveryStatus={deliveryStatus} tcc={mvp?.focusTcc} />}
          {page === "schedule" && <Schedule role={role} bookedCount={bookedCount} studentBooking={studentBooking} onBook={async (slot) => { try { const iso = slot.includes("Seg") ? "2026-08-17T18:40:00-03:00" : slot.includes("Qua") ? "2026-08-19T19:00:00-03:00" : slot.includes("Qui") ? "2026-08-20T18:40:00-03:00" : "2026-08-21T18:10:00-03:00"; await postAction({ action: "book", startsAt: iso, subject: "Orientação de TCC" }); notify("Agendamento confirmado e registrado no histórico."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao agendar"); } }} onCancel={async () => { try { const own = mvp?.appointments?.find((item) => item.studentEmail === mvp.profile?.email); if (own) await postAction({ action: "cancel", id: own.id }); notify("Agendamento cancelado. A vaga foi liberada."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao cancelar"); } }} notify={notify} />}
          {page === "mentoring" && <Mentoring role={role} studentName={role === "student" ? profileName : mvp?.students?.[0]?.name ?? "aluno selecionado"} messages={messages} topic={topic} setTopic={setTopic} notify={notify} sendPersistent={async (text) => { await postAction({ action: "message", text, topic }); }} references={mvp?.references} />}
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

function JoinClass({ email, onJoin, toast }: { email: string; onJoin: (code: string) => Promise<void>; toast: string }) {
  const [code, setCode] = useState("");
  return <main className="join-page"><section className="login-panel join-panel"><div className="brand dark-brand"><span className="brand-mark">M</span><span>MEUTCC</span></div><div><span className="eyebrow dark">Primeiro acesso</span><h1>Vincule-se à sua turma</h1><p>Olá, {email}. Digite o código fornecido pelo orientador para abrir seu acompanhamento de TCC.</p></div><label><span>Código da turma</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Ex.: TCCII-2026" /></label><button className="primary" onClick={() => onJoin(code)}>Entrar na turma</button><small>Seu acesso é individual e associado à sua conta.</small></section>{toast && <div className="toast" role="status">{toast}</div>}</main>;
}

function PageHead({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) { return <div className="page-head"><div><span className="eyebrow dark">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>; }
function Stat({ label, value, note, tone = "navy" }: { label: string; value: string; note: string; tone?: string }) { return <article className={`stat ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }

function AdvisorDashboard({ onOpenStudent, onSchedule, bookedCount, reviewStatus, liveStudents }: { onOpenStudent: () => void; onSchedule: () => void; bookedCount: number; reviewStatus: string; liveStudents?: MvpData["students"] }) {
  const rows = liveStudents ? liveStudents.map((item) => ({ name: item.name, stage: item.currentStage, action: item.name === "Ana Clara Ribeiro" ? reviewStatus : item.currentStage.includes("Marco 1") ? "Aguardando aluno" : "Acompanhar", progress: item.progress, status: item.name === "Ana Clara Ribeiro" ? reviewStatus : "Em andamento" })) : students;
  return <><PageHead eyebrow="TCC II · Direito · 2026.2" title="Bom dia, Márcio" text="Sua turma está avançando. Acompanhe os alunos que exigem atenção." action={<button className="primary" onClick={onSchedule}>Abrir agenda</button>} /><div className="stats"><Stat label="Alunos ativos" value={String(liveStudents?.length ?? 25)} note="Contas vinculadas à turma" /><Stat label="Agenda da semana" value={`${bookedCount}/6`} note={bookedCount >= 6 ? "Teto semanal atingido" : `${6 - bookedCount} vaga disponível`} tone="red" /><Stat label="Exigem atenção" value="7" note="Prazos e ausência de contato" tone="gold" /></div><div className="dashboard-grid"><section className="panel wide"><div className="panel-head"><div><h2>Acompanhamento da turma</h2><p>Dados salvos e atualizados após cada ação.</p></div><button className="secondary">Ver alunos</button></div><div className="student-table">{rows.map((student, index) => <button className="student-row" key={student.name} onClick={index === 0 ? onOpenStudent : undefined}><span className="avatar small">{student.name.split(" ").slice(0, 2).map(n => n[0]).join("")}</span><span><strong>{student.name}</strong><small>{student.stage}</small></span><span className={`status ${student.status.toLowerCase().replace(" ", "-")}`}>{student.action}</span><span className="progress-cell"><span className="progress"><i style={{ width: `${student.progress}%` }} /></span><b>{student.progress}%</b></span></button>)}</div></section><aside className="panel"><div className="panel-head"><div><h2>Agenda da semana</h2><p>{bookedCount} de 6 presenciais</p></div></div>{["Seg 18:00 · Bruno Almeida", "Ter 18:00 · Ana Clara", "Ter 18:40 · Carla Mendes", "Qui 18:00 · Diego Santos"].map(item => <div className="agenda-line" key={item}><span className="dot" /><span>{item}</span><small>Confirmado</small></div>)}<button className="secondary block" onClick={onSchedule}>Ver agenda completa</button></aside></div><section className="panel areas"><div className="panel-head"><div><h2>Temas por área</h2><p>Distribuição dos trabalhos cadastrados.</p></div></div>{[["Direito Constitucional",8],["Direito do Trabalho",6],["Direito Penal",5],["Direito Civil",4],["Direito Tributário",2]].map(([name,count]) => <div className="area" key={name}><span>{name}</span><span className="bar"><i style={{ width: `${Number(count) / 8 * 100}%` }} /></span><strong>{count}</strong></div>)}</section></>;
}

function Classroom({ notify }: { notify: (message: string) => void }) {
  const [step, setStep] = useState(1);
  return <><PageHead eyebrow="Configuração acadêmica" title="Turma TCC II — Direito" text="25 alunos · período 2026.2 · 17/08 a 05/12" action={<button className="primary" onClick={() => notify("Convites reenviados aos dois alunos pendentes.")}>Reenviar convites</button>} /><div className="stepper">{["Dados da turma", "Alunos", "Regras"].map((label, i) => <button key={label} className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""} onClick={() => setStep(i + 1)}><span>{i + 1}</span>{label}</button>)}</div><section className="panel form-panel">{step === 1 && <div className="form-grid"><Field label="Nome da turma" value="TCC II — Direito — Turma A" /><Field label="Período" value="2026.2" /><Field label="Curso" value="Direito" /><Field label="Orientador" value="Márcio Morais de Sousa" /><Field label="Início" value="17/08/2026" /><Field label="Encerramento" value="05/12/2026" /></div>}{step === 2 && <><div className="import-box"><strong>25 alunos vinculados</strong><span>25 e-mails válidos · nenhuma duplicidade</span><button className="secondary" onClick={() => notify("Planilha validada: 25 alunos identificados.")}>Importar nova lista</button></div><div className="simple-list">{students.slice(0,3).map(s => <div key={s.name}><span className="avatar small">{s.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</span><span><strong>{s.name}</strong><small>Cadastro validado</small></span><span className="status aprovado">Ativo</span></div>)}</div></>}{step === 3 && <div className="rule-grid"><Rule title="Prazo padrão" value="15 dias corridos por capítulo" /><Rule title="Teto semanal" value="6 atendimentos presenciais" /><Rule title="Limite individual" value="1 encontro por aluno/semana" /><Rule title="Aluno sem contato" value="Alerta após 15 dias" /><Rule title="Desbloqueio do Marco 3" value="Após aprovação dos capítulos centrais" /><Rule title="Convites" value="E-mail com ativação individual" /></div>}<div className="form-actions"><button className="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>Voltar</button><button className="primary" onClick={() => step < 3 ? setStep(step + 1) : notify("Regras da turma atualizadas.")}>{step < 3 ? "Continuar" : "Salvar regras"}</button></div></section></>;
}

function Field({ label, value }: { label: string; value: string }) { return <label><span>{label}</span><input defaultValue={value} /></label>; }
function Rule({ title, value }: { title: string; value: string }) { return <article><span className="rule-icon">✓</span><span><strong>{title}</strong><small>{value}</small></span></article>; }

function StudentRecord({ reviewStatus, setReviewStatus, onMentoring, deliveries }: { reviewStatus: string; setReviewStatus: (value: string, note: string) => Promise<void>; onMentoring: () => void; deliveries?: MvpData["deliveries"] }) {
  const [note, setNote] = useState("A fundamentação está consistente. Ajustar a transição entre os itens 2.2 e 2.3.");
  const rows = deliveries?.length ? deliveries : [["Sumário","v2","Aprovado"],["Capítulo 1","v2","Aprovado"],["Capítulo 2","v1","Requer ajustes"],["Capítulo 2","v2",reviewStatus]].map((item, index) => ({ id: index, kind: String(item[0]), version: Number(String(item[1]).replace("v", "")), status: String(item[2]), dueAt: null, fileKey: null, fileName: null }));
  return <><PageHead eyebrow="Ficha individual" title="Ana Clara Ribeiro" text="Direito Constitucional · matrícula 20261234" action={<button className="secondary" onClick={onMentoring}>Abrir mentoria</button>} /><div className="student-summary"><span className="avatar xlarge">AC</span><div><span className="eyebrow dark">Progresso geral</span><strong>{reviewStatus === "Aprovado" ? "70%" : "65%"}</strong><span className="progress large"><i style={{width: reviewStatus === "Aprovado" ? "70%" : "65%"}} /></span><small>Marco 2 · dados persistentes</small></div><div><span className="eyebrow dark">Próximo prazo</span><strong>18 ago</strong><small>Correção do Capítulo 2</small></div><div><span className="eyebrow dark">Encontros</span><strong>3</strong><small>Próximo em 20/08, às 18h</small></div></div><div className="record-grid"><section className="panel trail-panel"><h2>Trilha acadêmica</h2><Milestone number="1" title="Marco 1 — Planejamento" text="Tema, problema, objetivos e sumário aprovados" status="Concluído" done /><Milestone number="2" title="Marco 2 — Desenvolvimento" text={`Cap. 1 aprovado · Cap. 2 ${reviewStatus.toLowerCase()} · Cap. 3 pendente`} status="Em andamento" current /><Milestone number="3" title="Marco 3 — Lapidação final" text="Introdução e conclusão bloqueadas" status="Bloqueado" /></section><aside className="panel review-panel"><span className="eyebrow dark">Analisar entrega</span><h2>Capítulo 2 · versão 2</h2><p>Prazo do orientador: 18/08</p><button className="file-button">Abrir arquivo enviado</button><label><span>Parecer</span><textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><div className="split-actions"><button className="secondary danger" onClick={() => setReviewStatus("Requer ajustes", note)}>Requer ajustes</button><button className="primary" onClick={() => setReviewStatus("Aprovado", note)}>Aprovar</button></div></aside></div><section className="panel"><div className="panel-head"><div><h2>Versões recebidas</h2><p>O histórico é preservado sem sobrescrita.</p></div></div>{rows.map((v)=><div className="version-row" key={v.id}><span className="doc-icon">DOC</span><span><strong>{v.kind} · v{v.version}</strong><small>{v.fileName ?? "Registro acadêmico"}</small></span><span className={`status ${v.status.toLowerCase().replace(" ", "-")}`}>{v.status}</span></div>)}</section></>;
}

function Milestone({ number, title, text, status, done, current }: { number: string; title: string; text: string; status: string; done?: boolean; current?: boolean }) { return <article className={`milestone ${done ? "done" : current ? "current" : "locked"}`}><span className="milestone-node">{done ? "✓" : number}</span><span><strong>{title}</strong><small>{text}</small></span><b>{status}</b></article>; }

function StudentDashboard({ name, progress, deliveryStatus, submitDelivery, onSchedule, onMentoring }: { name: string; progress: number; deliveryStatus: string; submitDelivery: (file: File, note: string) => Promise<void>; onSchedule: () => void; onMentoring: () => void }) {
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("Professor, encaminho o Capítulo 3 para análise.");
  const [sending, setSending] = useState(false);
  return <><PageHead eyebrow="TCC II · Direito" title={`Olá, ${name.split(" ")[0]}`} text="Acompanhe sua próxima ação e o retorno do orientador." /><div className="stats"><Stat label="Progresso geral" value={`${progress}%`} note="Trilha atualizada" /><Stat label="Próxima entrega" value="02 set" note="Capítulo 3 · prazo vigente" tone="red" /><Stat label="Próximo encontro" value="Agenda" note="Consulte os horários" tone="gold" /></div><section className="action-card"><div><span className="eyebrow">Sua próxima ação</span><h2>{deliveryStatus === "Em análise" ? "Capítulo 3 enviado" : "Enviar Capítulo 3 — Discussão crítica"}</h2><p>{deliveryStatus === "Em análise" ? "A versão está com o orientador. Você receberá um aviso quando houver parecer." : "Desenvolva a discussão dos resultados e explicite a contribuição crítica do trabalho."}</p></div><span className="deadline-card"><small>Status</small><strong>{deliveryStatus}</strong><small>Prazo: 02/09, 23h59</small></span><button className="light-button" onClick={() => setShowUpload(!showUpload)}>{deliveryStatus === "Em análise" ? "Enviar nova versão" : "Enviar capítulo"}</button></section>{showUpload && <section className="panel upload-panel"><h2>Enviar Capítulo 3</h2><label className="upload-box"><strong>Selecionar DOCX ou PDF</strong><small>Até 20 MB · o arquivo será armazenado com segurança</small><input type="file" accept=".doc,.docx,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label><span>Mensagem ao orientador</span><textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><div className="form-actions"><button className="secondary" onClick={() => setShowUpload(false)}>Cancelar</button><button className="primary" disabled={!file || sending} onClick={async () => { if (!file) return; setSending(true); await submitDelivery(file, note); setSending(false); setShowUpload(false); }}>{sending ? "Enviando…" : "Confirmar envio"}</button></div></section>}<div className="dashboard-grid"><section className="panel trail-panel"><h2>Minha trilha</h2><Milestone number="1" title="Marco 1 — Planejamento" text="Tema e sumário aprovados" status="20%" done /><Milestone number="2" title="Marco 2 — Desenvolvimento" text={`Cap. 1 aprovado · Cap. 2 em análise · Cap. 3 ${deliveryStatus.toLowerCase()}`} status="45/50%" current /><Milestone number="3" title="Marco 3 — Lapidação final" text="Aguardando os capítulos centrais" status="Bloqueado" /></section><aside className="panel quick-actions"><h2>Acessos rápidos</h2><button onClick={onSchedule}><span>AGENDA</span><b>Próximo encontro</b><small>Consulte ou reserve um horário</small></button><button onClick={onMentoring}><span>MENTORIA</span><b>Mensagens do orientador</b><small>Dúvidas e referências do TCC</small></button></aside></div></>;
}

function MyTcc({ deliveryStatus, tcc }: { deliveryStatus: string; tcc?: MvpData["focusTcc"] }) { return <><PageHead eyebrow="Meu trabalho" title={tcc?.theme ?? "Tema em definição"} text={`Área: ${tcc?.area ?? "A definir"} · acompanhamento individual`} /><section className="panel trail-panel full"><h2>Trilha completa</h2><Milestone number="1" title="Tema, problema e objetivos" text="Validação inicial com o orientador" status="Aprovado" done /><Milestone number="2" title="Sumário" text="Estrutura do trabalho registrada" status="Aprovado" done /><Milestone number="3" title="Capítulo 1 — Fundamentos" text="Versão aprovada" status="Aprovado" done /><Milestone number="4" title="Capítulo 2 — Desenvolvimento" text="Versão enviada para análise" status="Em análise" current /><Milestone number="5" title="Capítulo 3 — Discussão crítica" text={deliveryStatus === "Em análise" ? "Versão enviada" : "Aguardando envio"} status={deliveryStatus} current /><Milestone number="6" title="Introdução e conclusão" text="Liberadas após aprovação dos capítulos" status="Bloqueado" /></section></>; }

function Schedule({ role, bookedCount, studentBooking, onBook, onCancel, notify }: { role: Role; bookedCount: number; studentBooking: string | null; onBook: (slot: string) => void; onCancel: () => void; notify: (message: string) => void }) {
  const slots = ["Seg 17 · 18:40", "Qua 19 · 19:00", "Qui 20 · 18:40", "Sex 21 · 18:10"];
  return <><PageHead eyebrow={role === "advisor" ? "Gestão de horários" : "Orientação presencial"} title={role === "advisor" ? "Agenda de orientações" : "Agendar orientação"} text="Semana de 17 a 21 de agosto de 2026" action={role === "advisor" ? <button className="primary" onClick={() => notify("Novos horários publicados para a próxima semana.")}>Abrir horários</button> : undefined} /><div className="stats"><Stat label="Atendimentos presenciais" value={`${bookedCount}/6`} note={bookedCount >= 6 ? "Teto semanal atingido" : `${6-bookedCount} agendamento permitido`} /><Stat label="Horários publicados" value="9" note={`${bookedCount} reservados`} tone="red" /><Stat label={role === "advisor" ? "Próximo atendimento" : "Meu encontro"} value={role === "advisor" ? "18:00" : studentBooking ? "Confirmado" : "Nenhum"} note={role === "advisor" ? "Terça · Ana Clara" : studentBooking ?? "Escolha um horário"} tone="gold" /></div><div className="schedule-grid"><section className="panel"><div className="panel-head"><div><h2>Horários da semana</h2><p>Presencial · duração de 40 minutos</p></div><span className={`capacity ${bookedCount >= 6 ? "full" : ""}`}>{bookedCount >= 6 ? "Agenda completa" : "Vagas abertas"}</span></div><div className="slot-grid">{slots.map(slot => <button key={slot} className={studentBooking === slot ? "slot selected" : "slot"} disabled={role === "student" && (bookedCount >= 6 || !!studentBooking)} onClick={() => role === "student" ? onBook(slot) : notify(`${slot}: horário ainda disponível.`)}><strong>{slot.split(" · ")[1]}</strong><span>{slot.split(" · ")[0]}</span><small>{studentBooking === slot ? "Seu encontro" : "Disponível"}</small></button>)}</div>{role === "student" && studentBooking && <div className="booking-confirm"><span><strong>Encontro confirmado</strong><small>{studentBooking} · Sala de orientação 2</small></span><button className="secondary danger" onClick={onCancel}>Cancelar</button></div>}</section><aside className="panel rules"><h2>Regras automáticas</h2><Rule title="Teto do orientador" value="Até 6 presenciais por semana" /><Rule title="Limite do aluno" value="1 encontro presencial por semana" /><Rule title="Conflito de horário" value="Vaga reservada deixa de aparecer" /><Rule title="Histórico" value="Assunto e presença ficam registrados" /></aside></div></>;
}

function Mentoring({ role, studentName, messages, topic, setTopic, notify, sendPersistent, references }: { role: Role; studentName: string; messages: Message[]; topic: string; setTopic: (topic: string) => void; notify: (message: string) => void; sendPersistent: (text: string) => Promise<void>; references?: MvpData["references"] }) {
  const [text, setText] = useState("");
  const topics = ["Capítulo 2 — Jurisprudência", "Capítulo 3 — Discussão crítica", "Metodologia", "Orientações gerais"];
  const send = async () => { if (!text.trim()) return notify("Escreva uma mensagem antes de enviar."); try { await sendPersistent(text.trim()); setText(""); notify("Mensagem enviada e registrada no histórico."); } catch (error) { notify(error instanceof Error ? error.message : "Erro ao enviar"); } };
  const materialRows = references?.length ? references.map((item) => [item.type.toUpperCase(), item.title]) : [["LIVRO","Curso de Direito Constitucional"],["JULGADO","RE 1.234.567/DF"],["ARTIGO","Interpretação e precedentes"]];
  return <><PageHead eyebrow="Canal exclusivo do TCC" title="Mentoria assíncrona" text={`Mensagens e referências vinculadas ao trabalho de ${studentName}.`} /><div className="mentoring-grid"><aside className="panel topics"><h2>Assuntos</h2>{topics.map((item,i)=><button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)}><span><strong>{item.split(" — ")[0]}</strong><small>{item.split(" — ")[1] ?? "Cronograma e dúvidas"}</small></span>{i === 0 && <i>1</i>}</button>)}</aside><section className="panel conversation"><div className="panel-head"><div><h2>{topic}</h2><p>Marco 2 · histórico persistente</p></div><span className="status aprovado">Leitura registrada</span></div><div className="message-list">{messages.map((m,i)=><article className="message" key={`${m.time}${i}`}><span className={`avatar small ${m.role === "Aluna" ? "student" : ""}`}>{m.author.split(" ").map(n=>n[0]).slice(0,2).join("")}</span><span><strong>{m.author} <small>{m.role}</small></strong><p>{m.text}</p><small>{m.time} · {m.read}</small></span></article>)}</div><div className="composer"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder={`Responder como ${role === "advisor" ? "orientador" : "aluno"}...`} /><div><label className="secondary attach">Anexar<input type="file" /></label><button className="primary" onClick={send}>Enviar mensagem</button></div></div></section><aside className="panel materials"><h2>Materiais vinculados</h2>{materialRows.map(v=><div className="material" key={v[1]}><span>{v[0]}</span><strong>{v[1]}</strong><small>Vinculado ao Capítulo 2</small></div>)}<button className="secondary block" onClick={()=>notify("Use a ficha do aluno para adicionar uma referência.")}>Adicionar referência</button></aside></div></>;
}
