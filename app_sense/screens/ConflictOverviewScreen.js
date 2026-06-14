import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import Logo from '../components/Logo'
import PieChart from '../components/PieChart'
import { Colors } from '../constants/colors'
import { Type } from '../constants/typography'

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return `${fmt(monday)}–${sunday.getDate()}, ${sunday.getFullYear()}`
}

function avgScore(alerts) {
  if (!alerts.length) return 0
  return (alerts.reduce((s, a) => s + a.score, 0) / alerts.length).toFixed(1)
}

export default function ConflictOverviewScreen({ alerts = [] }) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)

  const thisWeek = alerts.filter(a => new Date(a.date) >= weekStart)
  const high = thisWeek.filter(a => a.score >= 7)
  const medium = thisWeek.filter(a => a.score >= 4 && a.score < 7)
  const low = thisWeek.filter(a => a.score < 4)

  const bentos = [
    { label: 'High Risk', value: high.length, color: Colors.high },
    { label: 'Medium Risk', value: medium.length, color: Colors.medium },
    { label: 'Low Risk', value: low.length, color: Colors.low },
    { label: 'Avg Score', value: avgScore(thisWeek), color: Colors.black },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoRow}>
          <Logo title="Overview" />
        </View>

        <Text style={styles.weekText}>{getWeekRange()}</Text>
        <View style={styles.divider} />

        <View style={styles.chartWrap}>
          <PieChart high={high.length} medium={medium.length} low={low.length} size={240} />
          <View style={styles.legend}>
            {[['High', Colors.high], ['Medium', Colors.medium], ['Low', Colors.low]].map(([l, c]) => (
              <View key={l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: c }]} />
                <Text style={styles.legendText}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.grid}>
          {bentos.map((b, i) => (
            <View key={i} style={styles.bento}>
              <Text style={[styles.bentoValue, { color: b.color }]}>{b.value}</Text>
              <Text style={styles.bentoLabel}>{b.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { padding: 24, paddingTop: 12 },
  logoRow: { alignItems: 'center', marginBottom: 24 },
  weekText: { ...Type.header, color: Colors.black, marginBottom: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 24 },
  chartWrap: { alignItems: 'center', marginBottom: 28 },
  legend: { flexDirection: 'row', gap: 20, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...Type.body, color: Colors.gray },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bento: {
    width: '47%',
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
  },
  bentoValue: { ...Type.header, marginBottom: 4 },
  bentoLabel: { ...Type.body, color: Colors.gray },
})
