import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

const BACKEND_URL = 'http://10.37.103.237:3001'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied')
    return null
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  console.log('Push token:', token)

  try {
    await fetch(`${BACKEND_URL}/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch (err) {
    console.warn('Could not register token with backend:', err.message)
  }

  return token
}
