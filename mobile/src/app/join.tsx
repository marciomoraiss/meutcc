import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { palette } from '@/config/identity';
import { useAuth } from '@/providers/auth-provider';

export default function JoinScreen() {
  const { session, data, refreshing, joinCohort, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!session) return <Redirect href="/login" />;
  if (data?.profile && !data.needsJoin) return <Redirect href="/" />;

  const submit = async () => {
    if (!code.trim()) { setError('Informe o código fornecido pelo orientador.'); return; }
    setError(null);
    try { await joinCohort(code); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Código não reconhecido.'); }
  };

  return (
    <AppShell eyebrow="VÍNCULO À TURMA" title="Falta só um passo" subtitle={`Você entrou como ${session.user.email ?? 'aluno'}. Agora vincule sua conta à turma de TCC II.`}>
      <View style={styles.card}>
        <Text style={styles.label}>Código da turma</Text>
        <TextInput value={code} onChangeText={(value) => setCode(value.toUpperCase())} placeholder="Ex.: TCCII-2026" autoCapitalize="characters" autoCorrect={false} style={styles.input} accessibilityLabel="Código da turma" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={submit} disabled={refreshing} style={[styles.button, refreshing && styles.disabled]}>
          {refreshing ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.buttonText}>Entrar na turma</Text>}
        </Pressable>
        <Text style={styles.note}>Se seu e-mail já estiver na lista importada pelo orientador, o vínculo acontecerá automaticamente.</Text>
      </View>
      <Pressable onPress={signOut} style={styles.logout}><Text style={styles.logoutText}>Sair desta conta</Text></Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 20 },
  label: { color: palette.ink, fontWeight: '800', fontSize: 13, marginBottom: 8 },
  input: { height: 52, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, paddingHorizontal: 14, fontSize: 17, color: palette.ink, letterSpacing: 1 },
  error: { color: palette.red, fontSize: 13, marginTop: 8 },
  button: { height: 52, borderRadius: 12, backgroundColor: palette.red, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: palette.paper, fontSize: 15, fontWeight: '800' },
  note: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
  logout: { alignItems: 'center', padding: 12 }, logoutText: { color: palette.muted, fontWeight: '700' }, disabled: { opacity: 0.6 },
});
