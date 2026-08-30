import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// --------------------------------
// NOTIFICATION DISPLAY BEHAVIOR
// --------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --------------------------------
// GET PUSH NOTIFICATION TOKEN
// --------------------------------

export async function registerForPushNotificationsAsync() {
  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      'default',
      {
        name: 'default',
        importance:
          Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFFFFF',
      }
    );
  }

  // Check existing permissions
  const {
    status: existingStatus,
  } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  // Ask user if permission hasn't been granted
  if (existingStatus !== 'granted') {
    const {
      status,
    } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log(
      'Notification permission was not granted.'
    );

    return null;
  }

  // Expo project ID
  const projectId =
    Constants.expoConfig?.extra?.eas
      ?.projectId;

  if (!projectId) {
    console.log(
      'Expo project ID not found.'
    );

    return null;
  }

  try {
    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    console.log(
      'VMA Expo Push Token:',
      token.data
    );

    return token.data;
  } catch (error) {
    console.log(
      'Could not get Expo Push Token:',
      error
    );

    return null;
  }
}