import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { identity, palette } from '@/config/identity';

export function AppShell({ children, eyebrow, title, subtitle, action }: PropsWithChildren<{ eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.mark}><Text style={styles.markText}>M</Text></View>
          <View><Text style={styles.brand}>{identity.name}</Text><Text style={styles.tagline}>{identity.tagline}</Text></View>
        </View>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  content: { padding: 22, paddingBottom: 40, gap: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  mark: { width: 42, height: 42, borderRadius: 13, borderBottomLeftRadius: 4, backgroundColor: palette.red, alignItems: 'center', justifyContent: 'center' },
  markText: { color: palette.paper, fontSize: 21, fontWeight: '900' },
  brand: { color: palette.navy, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: palette.muted, fontSize: 11, marginTop: 1 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1 },
  eyebrow: { color: palette.red, fontWeight: '800', fontSize: 11, letterSpacing: 1.6, marginBottom: 5 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 6 },
});
