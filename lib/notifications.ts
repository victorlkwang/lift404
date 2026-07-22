import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show the alert (and play a sound) even if the app happens to be in the
// foreground when the rest timer fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REST_CHANNEL = 'rest-timer';

// Ask for permission once. Returns whether we can post notifications.
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// Schedule the "rest is over" notification `secs` from now. Returns the
// scheduled id (so it can be cancelled if the user skips or adjusts), or null
// if we don't have permission.
export async function scheduleRestDone(secs: number): Promise<string | null> {
  const ok = await ensureNotificationPermission();
  if (!ok) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REST_CHANNEL, {
      name: 'Rest timer',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 150, 400],
    });
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest over 💪',
      body: 'Time for your next set.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(secs)),
      channelId: REST_CHANNEL,
    },
  });
}

export async function cancelRestDone(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired or cancelled — nothing to do
  }
}
