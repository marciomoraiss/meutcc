import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { identity, palette } from '@/config/identity';

const readiness = [
  'Projeto independente da versão web',
  'Base preparada para iPhone e Android',
  'Integração segura com o Supabase planejada',
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.hero}>
        <View style={styles.mark}><Text style={styles.markText}>M</Text></View>
        <Text style={styles.brand}>{identity.name}</Text>
        <Text style={styles.tagline}>{identity.tagline}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>FASE 1</Text>
        <Text style={styles.title}>Preparação técnica concluída</Text>
        <Text style={styles.description}>
          Esta é a base exclusiva do aplicativo mobile. O MEUTCC na web permanece separado e sem alterações.
        </Text>

        <View style={styles.list}>
          {readiness.map((item) => (
            <View key={item} style={styles.listItem}>
              <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>Versão mobile em desenvolvimento</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas, padding: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 28 },
  mark: { width: 70, height: 70, borderRadius: 22, borderBottomLeftRadius: 7, backgroundColor: palette.red, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  markText: { color: palette.paper, fontSize: 32, fontWeight: '800' },
  brand: { color: palette.navy, fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: palette.muted, fontSize: 15, marginTop: 4 },
  card: { backgroundColor: palette.paper, borderColor: palette.line, borderWidth: 1, borderRadius: 20, padding: 24 },
  eyebrow: { color: palette.red, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  title: { color: palette.ink, fontSize: 24, fontWeight: '700', lineHeight: 29, marginBottom: 10 },
  description: { color: palette.muted, fontSize: 15, lineHeight: 22 },
  list: { gap: 14, marginTop: 24 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.greenSoft, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: palette.green, fontWeight: '900' },
  listText: { flex: 1, color: palette.ink, fontSize: 14, lineHeight: 20 },
  footer: { color: palette.muted, textAlign: 'center', fontSize: 12, marginTop: 22 },
});
