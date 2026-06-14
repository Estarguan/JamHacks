import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications } from './services/notifications'

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

  useEffect(() => {
    registerForPushNotifications()

    // Notification received while app is in foreground — add to list
    const notifListener = Notifications.addNotificationReceivedListener(notification => {
      addAlert(notificationToAlert(notification))
    })

    // Notification tapped — add to list and open detail screen
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
    if (tab === 'Activity') return <ActivityScreen navigation={navigation} alerts={alerts} />
    if (tab === 'Overview') return <ConflictOverviewScreen navigation={navigation} alerts={alerts} />
    return null
  }

  function renderModal() {
    if (!modal) return null
    if (modal.screen === 'AlertDetail') {
      return (
        <View style={StyleSheet.absoluteFill}>
          <AlertDetailScreen navigation={navigation} route={{ params: modal.params }} />
        </View>
      )
    }
    return null
  }

  return (
    <View style={styles.root}>
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
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: Colors.gray },
  tabActive: { color: Colors.blue },
})
