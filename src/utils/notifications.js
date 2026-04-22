import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleFeedingReminder = async (intervalHours = 3, babyName = 'your baby') => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const seconds = Math.round(intervalHours * 3600);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time to feed ${babyName}!`,
      body: `It's been ${intervalHours} hours since the last feeding.`,
      sound: true,
    },
    trigger: {
      type: 'timeInterval',
      seconds,
      repeats: true,
    },
  });
};

export const cancelFeedingReminder = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const scheduleVaccineReminder = async (vaccineName, date, babyName) => {
  const trigger = new Date(date);
  trigger.setDate(trigger.getDate() - 3); // 3 days before

  if (trigger < new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Upcoming vaccine for ${babyName}`,
      body: `${vaccineName} is scheduled in 3 days.`,
      sound: true,
    },
    trigger: { date: trigger },
  });
};
