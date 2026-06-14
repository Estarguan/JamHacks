import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, Image } from 'react-native'
import Logo from '../components/Logo'
import RiskBadge from '../components/RiskBadge'
import { Colors, riskColor, riskLabel } from '../constants/colors'

const FRAME_URL = 'http://10.37.103.237:3001/latest-frame'

export default function AlertDetailScreen({ navigation, route }) {
  const alert = route?.params?.alert ?? {
    location: 'Kitchen',
    type: 'Fire detected',
    score: 9,
    time: 'Now',
    description: 'Rapid motion and audio spike detected. AI analysis indicates high probability of conflict.',
  }

  const [showCamera, setShowCamera] = useState(false)
  const [shownUri, setShownUri] = useState('')
  const [loadingUri, setLoadingUri] = useState('')
  const color = riskColor(alert.score)

  const nextUri = () => `${FRAME_URL}?t=${Date.now()}`

  const openCamera = useCallback(() => {
    const first = nextUri()
    setShownUri('')
    setLoadingUri(first)
    setShowCamera(true)
  }, [])

  const onFrameLoad = useCallback(() => {
    setShownUri(loadingUri)
    setLoadingUri(nextUri())
  }, [loadingUri])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoRow}>
          <Logo title="Alert" />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.location}>{alert.location}</Text>
              <Text style={styles.type}>{alert.type}</Text>
            </View>
            <Text style={styles.time}>{alert.time}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.riskRow}>
            <RiskBadge score={alert.score} size={48} />
            <Text style={[styles.riskLabel, { color }]}>{riskLabel(alert.score)}</Text>
          </View>

          <View style={styles.descriptionBlock}>
            <Text style={styles.bullet}>• {alert.description}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
          <Text style={styles.cameraBtnText}>View Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraModal}>
          <SafeAreaView style={styles.cameraModalInner}>
            <View style={styles.cameraHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.frameContainer}>
              {shownUri ? (
                <Image source={{ uri: shownUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
              ) : null}
              <Image
                source={{ uri: loadingUri }}
                style={[StyleSheet.absoluteFill, { opacity: 0 }]}
                resizeMode="contain"
                onLoad={onFrameLoad}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { padding: 24, paddingTop: 12 },
  logoRow: { alignItems: 'center', marginBottom: 32 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  location: { fontSize: 20, fontWeight: '700', color: Colors.black },
  type: { fontSize: 14, color: Colors.gray, marginTop: 2 },
  time: { fontSize: 14, color: Colors.gray },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 16 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  riskLabel: { fontSize: 26, fontWeight: '700' },
  descriptionBlock: { marginTop: 4 },
  bullet: { fontSize: 15, color: Colors.black, lineHeight: 22 },
  cameraBtn: {
    backgroundColor: Colors.black,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  dismissBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissText: { fontSize: 16, fontWeight: '500', color: Colors.black },
  cameraModal: { flex: 1, backgroundColor: '#000' },
  cameraModalInner: { flex: 1 },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#ef4444', letterSpacing: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  frameContainer: { flex: 1, backgroundColor: '#000' },
})
