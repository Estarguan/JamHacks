import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import Logo from '../components/Logo'
import SpiderFace from '../components/SpiderFace'
import { Colors } from '../constants/colors'
import { Type } from '../constants/typography'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

export default function HomeScreen({ navigation, alerts = [] }) {
  const unread = alerts.filter(a => !a.read).length

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoRow}>
          <Logo title="Home" />
        </View>

        <SpiderFace size={260} />

        <Text style={styles.greeting}>{greeting()}</Text>

        <View style={styles.card}>
          <View style={styles.redLine} />
          <Text style={styles.cardLabel}>{unread} unread alert{unread !== 1 ? 's' : ''}</Text>
          <TouchableOpacity
            style={styles.blackBtn}
            onPress={() => navigation.navigate('Activity')}
          >
            <Text style={styles.blackBtnText}>Check</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>This month's stats</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Overview')}>
            <Text style={styles.viewLink}>View</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { padding: 24, paddingTop: 76 },
  logoRow: { alignItems: 'center', marginBottom: 16 },
  greeting: { ...Type.header, fontFamily: 'GoogleSansFlex-Medium', color: Colors.black, marginBottom: 20 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 16,
  },
  redLine: {
    width: 36,
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    marginBottom: 10,
  },
  cardLabel: { ...Type.semiheader, color: Colors.black, marginBottom: 16 },
  blackBtn: {
    backgroundColor: Colors.black,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignSelf: 'flex-start',
  },
  blackBtnText: { ...Type.semiheader, color: Colors.white },
  cardTitle: { ...Type.semiheader, color: Colors.black, marginBottom: 8 },
  viewLink: { ...Type.body, color: '#EF4444' },
})
