import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { identity, palette } from '@/config/identity';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { session, requestMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (session) return <Redirect href="/" />;

  const submit = async () => {
    if (!email.trim().includes('@')) { setError('Informe um e-mail válido.'); return; }
    setSending(true); setError(null);
    try { await requestMagicLink(email); setSent(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível enviar o link.'); }
    finally { setSending(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brandBlock}>
          <View style={styles.mark}><Text style={styles.markText}>M</Text></View>
          <Text style={styles.brand}>{identity.name}</Text>
          <Text style={styles.tagline}>{identity.tagline}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ACESSO SEGURO</Text>
          <Text style={styles.title}>{sent ? 'Confira seu e-mail' : 'Entre no MEUTCC'}</Text>
          <Text style={styles.description}>{sent ? `Enviamos um link de acesso para ${email.trim().toLowerCase()}. Toque nele para voltar ao aplicativo.` : 'Use o mesmo e-mail cadastrado pela sua turma. Não é necessário criar uma senha.'}</Text>
          {!sent ? (
            <>
              <Text style={styles.label}>E-mail</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="seuemail@exemplo.com" placeholderTextColor="#98A2B3" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" style={styles.input} accessibilityLabel="E-mail de acesso" />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable onPress={submit} disabled={sending} style={({ pressed }) => [styles.button, pressed && styles.pressed, sending && styles.disabled]} accessibilityRole="button">
                {sending ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.buttonText}>Enviar link de acesso</Text>}
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setSent(false)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Usar outro e-mail</Text></Pressable>
          )}
          <Text style={styles.help}>O link é pessoal e de uso único. Se não encontrar, verifique a caixa de spam.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.navy },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  mark: { width: 68, height: 68, borderRadius: 21, borderBottomLeftRadius: 6, backgroundColor: palette.red, alignItems: 'center', justifyContent: 'center' },
  markText: { color: palette.paper, fontSize: 32, fontWeight: '900' },
  brand: { color: palette.paper, fontSize: 27, fontWeight: '900', letterSpacing: 2, marginTop: 13 },
  tagline: { color: '#CAD2E0', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: palette.paper, borderRadius: 22, padding: 24 },
  eyebrow: { color: palette.red, fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: palette.ink, fontSize: 25, fontWeight: '800', marginTop: 8 },
  description: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  label: { color: palette.ink, fontSize: 13, fontWeight: '700', marginTop: 22, marginBottom: 7 },
  input: { height: 52, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, paddingHorizontal: 14, color: palette.ink, fontSize: 16, backgroundColor: '#FCFCFD' },
  error: { color: palette.red, fontSize: 13, marginTop: 8 },
  button: { height: 52, borderRadius: 12, backgroundColor: palette.red, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: palette.paper, fontWeight: '800', fontSize: 15 },
  secondaryButton: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  secondaryText: { color: palette.navy, fontWeight: '800' },
  help: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 17 },
  pressed: { opacity: 0.84 }, disabled: { opacity: 0.6 },
});
