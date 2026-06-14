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

  const avgBar = [
    { color: Colors.high,   flex: high.length },
    { color: Colors.medium, flex: medium.length },
    { color: Colors.low,    flex: low.length },
  ].filter(s => s.flex > 0)
  if (avgBar.length === 0) avgBar.push({ color: Colors.border, flex: 1 })

  const bentos = [
    { label: 'High Risk',   value: high.length,        color: Colors.high,   bar: [{ color: Colors.high,   flex: 1 }] },
    { label: 'Medium Risk', value: medium.length,      color: Colors.medium, bar: [{ color: Colors.medium, flex: 1 }] },
    { label: 'Low Risk',    value: low.length,         color: Colors.low,    bar: [{ color: Colors.low,    flex: 1 }] },
    { label: 'Avg Score',   value: avgScore(thisWeek), color: Colors.black,  bar: avgBar },
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
              <View style={styles.bentoBar}>
                {b.bar.map((seg, j) => (
                  <View
                    key={j}
                    style={[
                      styles.bentoBarSegment,
                      { backgroundColor: seg.color, flex: seg.flex },
                      j === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
                      j === b.bar.length - 1 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
                    ]}
                  />
                ))}
              </View>
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
  container: { padding: 24, paddingTop: 76 },
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 20,
    justifyContent: 'center',
  },
  bentoBar: { flexDirection: 'row', width: 44, height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  bentoBarSegment: { height: 5 },
  bentoValue: { ...Type.header, marginBottom: 4 },
  bentoLabel: { ...Type.body, color: Colors.gray },
})
