import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { identity, palette } from '@/config/identity';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { session, data, booting, refreshing } = useAuth();
  if (booting || (session && !data && refreshing)) return <LoadingScreen />;
  if (!session) return <Redirect href="/login" />;
  if (!data || data.needsJoin || !data.profile) return <Redirect href="/join" />;
  return <Redirect href={data.profile.role === 'advisor' ? '/advisor' : '/student'} />;
}

function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}><Text style={styles.markText}>M</Text></View>
      <Text style={styles.brand}>{identity.name}</Text>
      <ActivityIndicator color={palette.red} style={styles.spinner} />
      <Text style={styles.message}>Preparando seu acompanhamento...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.navy, padding: 28 },
  mark: { width: 72, height: 72, borderRadius: 22, borderBottomLeftRadius: 7, backgroundColor: palette.red, alignItems: 'center', justifyContent: 'center' },
  markText: { color: palette.paper, fontSize: 34, fontWeight: '900' },
  brand: { color: palette.paper, fontSize: 28, fontWeight: '900', letterSpacing: 2, marginTop: 15 },
  spinner: { marginTop: 30 },
  message: { color: '#CAD2E0', fontSize: 13, marginTop: 12 },
});
