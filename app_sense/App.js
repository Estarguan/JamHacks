import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { useFonts } from 'expo-font'
import { Type } from './constants/typography'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications } from './services/notifications'

import CornerWebs from './components/CornerWebs'
import HomeScreen from './screens/HomeScreen'
import ActivityScreen from './screens/ActivityScreen'
import ConflictOverviewScreen from './screens/ConflictOverviewScreen'
import AlertDetailScreen from './screens/AlertDetailScreen'
import { Colors } from './constants/colors'

const TABS = ['Home', 'Activity', 'Overview']

function notificationToAlert(notification) {
  const data = notification.request.content.data?.alert
  if (!data) return null
  return {
    id: notification.request.identifier,
    type: data.type ?? 'Alert',
    location: data.location ?? 'Home',
    score: data.score ?? 5,
    date: data.date ?? new Date().toISOString(),
    description: data.description ?? '',
    read: false,
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'GoogleSansFlex-Regular':  require('./assets/fonts/GoogleSansFlex-Regular.ttf'),
    'GoogleSansFlex-Medium':   require('./assets/fonts/GoogleSansFlex-Medium.ttf'),
    'GoogleSansFlex-SemiBold': require('./assets/fonts/GoogleSansFlex-SemiBold.ttf'),
    'GoogleSansFlex-Bold':     require('./assets/fonts/GoogleSansFlex-Bold.ttf'),
  })

  const [tab, setTab] = useState('Home')
  const [modal, setModal] = useState(null)
  const [alerts, setAlerts] = useState([])
  const responseListener = useRef()

  function addAlert(alert) {
    if (!alert) return
    setAlerts(prev => {
      if (prev.find(a => a.id === alert.id)) return prev
      return [alert, ...prev]
    })
  }

  function markAlertRead(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  function deleteAlert(id) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  useEffect(() => {
    registerForPushNotifications()

    const notifListener = Notifications.addNotificationReceivedListener(notification => {
      addAlert(notificationToAlert(notification))
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const alert = notificationToAlert(response.notification)
      addAlert(alert)
      if (alert) setModal({ screen: 'AlertDetail', params: { alert } })
    })

    return () => {
      notifListener.remove()
      responseListener.current?.remove()
    }
  }, [])

  if (!fontsLoaded) return null

  const navigation = {
    navigate: (screen, params = {}) => {
      if (TABS.includes(screen)) {
        setTab(screen)
        setModal(null)
      } else {
        setModal({ screen, params })
      }
    },
    goBack: () => setModal(null),
  }

  function renderTab() {
    if (tab === 'Home') return <HomeScreen navigation={navigation} alerts={alerts} />
    if (tab === 'Activity') return <ActivityScreen navigation={navigation} alerts={alerts} markAlertRead={markAlertRead} />
    if (tab === 'Overview') return <ConflictOverviewScreen navigation={navigation} alerts={alerts} />
    return null
  }

  function renderModal() {
    if (!modal) return null
    if (modal.screen === 'AlertDetail') {
      return (
        <View style={StyleSheet.absoluteFill}>
          <AlertDetailScreen navigation={navigation} route={{ params: modal.params }} markAlertRead={markAlertRead} deleteAlert={deleteAlert} />
        </View>
      )
    }
    return null
  }

  return (
    <View style={styles.root}>
      <CornerWebs />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.content}>{renderTab()}</View>
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={styles.tabItem} onPress={() => { setTab(t); setModal(null) }}>
            <Text style={[styles.tabLabel, tab === t && styles.tabActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {renderModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    paddingBottom: 36,
    paddingTop: 16,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { ...Type.body, color: Colors.gray },
  tabActive: { color: Colors.blue },
})
