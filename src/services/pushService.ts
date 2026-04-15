import { getCurrentUser } from './authService'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/core/firebase'

function isNative(): boolean {
  return 'Capacitor' in window
}

/**
 * Register for push notifications on iOS.
 * Requests permission, gets FCM token, and saves it to Firestore.
 */
export async function registerPushNotifications(): Promise<void> {
  if (!isNative()) {
    console.log('[PushService] Browser mode — push stubbed')
    return
  }

  try {
    const { PushNotifications } = await Function(
      'return import("@capacitor/push-notifications")'
    )()

    // Request permission
    const permResult = await PushNotifications.requestPermissions()
    if (permResult.receive !== 'granted') {
      console.log('[PushService] Permission denied')
      return
    }

    // Register with APNs
    await PushNotifications.register()

    // Listen for registration success — save token to Firestore
    PushNotifications.addListener(
      'registration',
      async (token: { value: string }) => {
        console.log('[PushService] Token:', token.value)
        await saveToken(token.value)
      }
    )

    // Listen for registration errors
    PushNotifications.addListener(
      'registrationError',
      (error: { error: string }) => {
        console.warn('[PushService] Registration error:', error.error)
      }
    )

    // Listen for received notifications while app is open
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: { title?: string; body?: string; data?: Record<string, string> }) => {
        console.log('[PushService] Notification received:', notification.title)
        // Could show an in-app toast here
      }
    )

    // Listen for notification tap (app opened from notification)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: { notification: { data?: Record<string, string> } }) => {
        const data = action.notification.data
        console.log('[PushService] Notification tapped:', data)
        // Could navigate to a specific screen based on data.type
      }
    )
  } catch (e) {
    console.warn('[PushService] Setup failed:', e)
  }
}

/**
 * Save the FCM/APNs token to Firestore so Cloud Functions can send notifications.
 */
async function saveToken(token: string): Promise<void> {
  const user = getCurrentUser()
  if (!user) return

  const tokenRef = doc(db, 'players', user.uid, 'tokens', 'push')
  await setDoc(tokenRef, {
    token,
    platform: 'ios',
    updatedAt: serverTimestamp(),
  })
}
