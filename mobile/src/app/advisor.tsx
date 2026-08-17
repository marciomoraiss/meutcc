import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { palette } from '@/config/identity';
import { useAuth } from '@/providers/auth-provider';

export default function AdvisorScreen() {
  const { session, data, signOut } = useAuth();
  if (!session) return <Redirect href="/login" />;
  if (!data?.profile) return <Redirect href="/" />;
  if (data.profile.role !== 'advisor') return <Redirect href="/student" />;
  return (
    <AppShell eyebrow="PERFIL DO ORIENTADOR" title={`Olá, ${data.profile.name.split(' ')[0]}`} subtitle="Seu acesso foi identificado corretamente. Nesta fase, o aplicativo prioriza a experiência do aluno.">
      <View style={styles.card}><Text style={styles.number}>{data.students?.length ?? 0}</Text><Text style={styles.title}>alunos vinculados</Text><Text style={styles.text}>O painel gerencial completo continua disponível na versão web enquanto os módulos móveis do orientador são preparados.</Text></View>
      <Pressable onPress={signOut} style={styles.button}><Text style={styles.buttonText}>Sair do aplicativo</Text></Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.paper, borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 22 },
  number: { color: palette.red, fontSize: 42, fontWeight: '900' }, title: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  text: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 10 },
  button: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: palette.navy, fontWeight: '800' },
});
