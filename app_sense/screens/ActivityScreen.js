import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Animated, Easing, Platform, UIManager } from 'react-native'
import Logo from '../components/Logo'
import RiskBadge from '../components/RiskBadge'
import { Colors } from '../constants/colors'
import { Type } from '../constants/typography'

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins} mins ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return 'Today'
}

function AnimatedAlertRow({ alert, onPress, index, totalCount, collapsing, onCollapseComplete, exiting, onExitComplete }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current

  // Enter: slide down from above + fade in
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start()
  }, [])

  // Collapse: reverse stagger, slide back up
  useEffect(() => {
    if (!collapsing) return
    const delay = 170 + (totalCount - 1 - index) * 70
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 260, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 260, delay, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished && index === 0) onCollapseComplete?.() })
  }, [collapsing])

  // Exit to Previous: fade out + slide DOWN
  useEffect(() => {
    if (!exiting) return
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 320, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 24, duration: 320, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) onExitComplete?.() })
  }, [exiting])

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => !exiting && !collapsing && onPress(alert)}
        activeOpacity={exiting || collapsing ? 1 : 0.7}
      >
        <View style={styles.alertLeft}>
          <RiskBadge score={alert.score} size={40} />
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{alert.type}</Text>
            <Text style={styles.alertSub}>{alert.location}</Text>
          </View>
        </View>
        <View style={styles.alertRight}>
          <Text style={styles.alertTime}>{timeAgo(alert.date)}</Text>
          <Text style={styles.arrow}>↓</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function CollapseButton({ collapsing, onPress }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start()
  }, [])

  useEffect(() => {
    if (!collapsing) return
    Animated.timing(anim, { toValue: 0, duration: 160, easing: Easing.in(Easing.ease), useNativeDriver: true }).start()
  }, [collapsing])

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] })

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX }] }}>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.collapseText}>Collapse</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function SummaryCard({ newAlerts, onExpand }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start()
  }, [])

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] })

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => newAlerts.length > 0 && onExpand()}
        activeOpacity={newAlerts.length > 0 ? 0.7 : 1}
      >
        <View style={styles.alertLeft}>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{newAlerts.length}</Text>
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>New Alerts</Text>
            <Text style={styles.alertSub}>
              {newAlerts.map(a => a.location).join(', ') || 'None'}
            </Text>
          </View>
        </View>
        <View style={styles.alertRight}>
          <Text style={styles.alertTime}>Now</Text>
          {newAlerts.length > 0 && <Text style={styles.arrow}>↓</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function AlertRow({ alert, onPress, animateIn }) {
  const opacity = useRef(new Animated.Value(animateIn ? 0 : 1)).current
  const translateY = useRef(new Animated.Value(animateIn ? -12 : 0)).current

  useEffect(() => {
    if (!animateIn) return
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity style={styles.alertCard} onPress={() => onPress(alert)}>
        <View style={styles.alertLeft}>
          <RiskBadge score={alert.score} size={40} />
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{alert.type}</Text>
            <Text style={styles.alertSub}>{alert.location}</Text>
          </View>
        </View>
        <View style={styles.alertRight}>
          <Text style={styles.alertTime}>{timeAgo(alert.date)}</Text>
          <Text style={styles.arrow}>↓</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function ActivityScreen({ navigation, alerts = [], markAlertRead }) {
  const [newExpanded, setNewExpanded] = useState(false)
  const [collapsing, setCollapsing] = useState(false)
  const [recentlyReadId, setRecentlyReadId] = useState(null)
  const prevOldIds = useRef([])

  const newAlerts = alerts.filter(a => !a.read)
  const oldAlerts = alerts.filter(a => a.read)

  useEffect(() => {
    const currentIds = oldAlerts.map(a => a.id)
    const added = currentIds.find(id => !prevOldIds.current.includes(id))
    if (added) setRecentlyReadId(added)
    prevOldIds.current = currentIds
  }, [oldAlerts.length])

  useEffect(() => {
    if (newExpanded && newAlerts.length === 0) {
      setCollapsing(false)
      setNewExpanded(false)
    }
  }, [newAlerts.length])

  function openAlert(alert) {
    navigation.navigate('AlertDetail', { alert })
  }

  function expand() { setNewExpanded(true) }

  function collapse() { setCollapsing(true) }

  function onCollapseComplete() {
    setCollapsing(false)
    setNewExpanded(false)
  }

  const showRows = newExpanded || collapsing

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoRow}>
          <Logo />
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.heading}>Activity</Text>
          <TouchableOpacity>
            <Text style={styles.filterIcon}>≡</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Recent</Text>
          {showRows && <CollapseButton collapsing={collapsing} onPress={collapse} />}
        </View>

        {!showRows ? (
          <SummaryCard newAlerts={newAlerts} onExpand={expand} />
        ) : (
          newAlerts.map((alert, i) => (
            <AnimatedAlertRow
              key={alert.id}
              alert={alert}
              onPress={openAlert}
              index={i}
              totalCount={newAlerts.length}
              collapsing={collapsing}
              onCollapseComplete={onCollapseComplete}
            />
          ))
        )}

        {oldAlerts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Previous</Text>
            </View>
            {oldAlerts.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onPress={openAlert}
                animateIn={alert.id === recentlyReadId}
              />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { padding: 24, paddingTop: 76 },
  logoRow: { alignItems: 'center', marginBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: { ...Type.header, color: Colors.black },
  filterIcon: { fontSize: 22, color: Colors.black },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: { ...Type.body, color: Colors.gray },
  collapseText: { ...Type.body, color: Colors.gray },
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  alertInfo: { flex: 1 },
  alertTitle: { ...Type.semiheader, color: Colors.black },
  alertSub: { ...Type.body, color: Colors.gray, marginTop: 2 },
  alertRight: { alignItems: 'flex-end', gap: 6 },
  alertTime: { ...Type.body, color: Colors.gray },
  arrow: { ...Type.semiheader, color: Colors.black },
  newBadge: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  newBadgeText: { ...Type.semiheader, color: Colors.blue },
})
