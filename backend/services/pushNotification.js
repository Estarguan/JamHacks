const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

let pushToken = null

export function registerToken(token) {
  pushToken = token
  console.log('Push token registered:', token)
}

export async function sendAlertNotification({ confidence, analysis }) {
  if (!pushToken) {
    console.warn('No push token registered — cannot send notification')
    return
  }

  const risk = confidence >= 0.8 ? 'High Risk' : confidence >= 0.5 ? 'Medium Risk' : 'Low Risk'
  const score = Math.round(confidence * 10)

  const message = {
    to: pushToken,
    sound: 'default',
    title: `⚠️ ${risk} Detected`,
    body: analysis?.summary ?? 'Suspicious activity detected at home.',
    data: {
      alert: {
        type: risk,
        location: 'Home',
        score,
        confidence,
        description: analysis?.summary ?? '',
        date: new Date().toISOString(),
      },
    },
    priority: 'high',
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
    const json = await res.json()
    console.log('Push notification sent:', json)
  } catch (err) {
    console.error('Failed to send push notification:', err.message)
  }
}
