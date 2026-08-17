import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { palette } from '@/config/identity';
import { useAuth } from '@/providers/auth-provider';

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'A definir';

export default function StudentScreen() {
  const { session, data, refreshing, refresh, signOut } = useAuth();
  useFocusEffect(useCallback(() => { if (session) void refresh(); }, [session, refresh]));
  if (!session) return <Redirect href="/login" />;
  if (!data?.profile || data.needsJoin) return <Redirect href="/" />;
  if (data.profile.role !== 'student') return <Redirect href="/advisor" />;

  const tcc = data.focusTcc;
  const nextDelivery = (data.deliveries ?? []).find((item) => item.status === 'Pendente' || item.status === 'Requer ajustes');
  const nextAppointment = (data.appointments ?? []).find((item) => new Date(item.startsAt).getTime() > Date.now());
  const unreadMessages = (data.messages ?? []).filter((item) => !item.readAt && item.authorRole === 'Orientador').length;

  return (
    <AppShell eyebrow={data.cohort?.term} title={`Olá, ${data.profile.name.split(' ')[0]}`} subtitle={data.cohort?.name}>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}><View><Text style={styles.cardEyebrow}>PROGRESSO DO TCC</Text><Text style={styles.progressValue}>{tcc?.progress ?? 0}%</Text></View><View style={styles.stageBadge}><Text style={styles.stageText}>{tcc?.currentStage ?? 'Marco 1'}</Text></View></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(3, tcc?.progress ?? 0)}%` }]} /></View>
        <Text style={styles.theme}>{tcc?.theme ?? 'Tema em definição'}</Text>
        <Text style={styles.area}>{tcc?.area ?? 'Área a definir'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Próximas ações</Text>
      <View style={styles.grid}>
        <View style={styles.smallCard}><Text style={styles.smallLabel}>ENTREGA</Text><Text style={styles.smallTitle}>{nextDelivery?.kind ?? 'Acompanhe sua trilha'}</Text><Text style={styles.smallMeta}>{nextDelivery ? `Prazo: ${formatDate(nextDelivery.dueAt)}` : 'Nenhuma pendência aberta'}</Text></View>
        <View style={styles.smallCard}><Text style={styles.smallLabel}>ORIENTAÇÃO</Text><Text style={styles.smallTitle}>{nextAppointment ? formatDate(nextAppointment.startsAt) : 'Sem agendamento'}</Text><Text style={styles.smallMeta}>Limite de um encontro por semana</Text></View>
      </View>

      <View style={styles.mentorCard}><View style={styles.mentorCopy}><Text style={styles.cardEyebrow}>MENTORIA ASSÍNCRONA</Text><Text style={styles.mentorTitle}>{unreadMessages ? `${unreadMessages} mensagem(ns) nova(s)` : 'Canal em dia'}</Text><Text style={styles.smallMeta}>Dúvidas, arquivos e referências ficam centralizados aqui.</Text></View><View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{unreadMessages}</Text></View></View>

      <Pressable onPress={() => void refresh()} disabled={refreshing} style={styles.secondaryButton}><Text style={styles.secondaryText}>{refreshing ? 'Atualizando...' : 'Atualizar acompanhamento'}</Text></Pressable>
      <Pressable onPress={signOut} style={styles.logout}><Text style={styles.logoutText}>Sair do aplicativo</Text></Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  progressCard: { backgroundColor: palette.navy, borderRadius: 20, padding: 21 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardEyebrow: { color: '#AEBBD0', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  progressValue: { color: palette.paper, fontSize: 40, fontWeight: '900', marginTop: 3 },
  stageBadge: { backgroundColor: palette.navyLight, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, maxWidth: '55%' },
  stageText: { color: palette.paper, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#40516E', overflow: 'hidden', marginTop: 17 },
  fill: { height: '100%', backgroundColor: palette.red, borderRadius: 4 },
  theme: { color: palette.paper, fontSize: 17, fontWeight: '800', lineHeight: 23, marginTop: 18 },
  area: { color: '#CAD2E0', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', marginTop: 2 },
  grid: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, minHeight: 150, backgroundColor: palette.paper, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 16 },
  smallLabel: { color: palette.red, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  smallTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: '800', marginTop: 9 },
  smallMeta: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  mentorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.paper, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 17 },
  mentorCopy: { flex: 1 }, mentorTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', marginTop: 7 },
  messageBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.greenSoft, alignItems: 'center', justifyContent: 'center' },
  messageBadgeText: { color: palette.green, fontWeight: '900', fontSize: 16 },
  secondaryButton: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: palette.navy, fontWeight: '800' }, logout: { alignItems: 'center', padding: 9 }, logoutText: { color: palette.muted, fontWeight: '700', fontSize: 13 },
});
