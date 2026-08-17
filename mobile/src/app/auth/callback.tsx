import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/config/identity';
import { useAuth } from '@/providers/auth-provider';

export default function CallbackScreen() {
  const { session, callbackError } = useAuth();
  if (session) return <Redirect href="/" />;
  return (
    <View style={styles.container}>
      <ActivityIndicator color={palette.red} size="large" />
      <Text style={styles.title}>{callbackError ? 'Não foi possível entrar' : 'Validando seu acesso'}</Text>
      <Text style={styles.text}>{callbackError ?? 'Aguarde enquanto conectamos sua conta ao MEUTCC.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvas, alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { color: palette.ink, fontSize: 22, fontWeight: '800', marginTop: 18 },
  text: { color: palette.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
});
