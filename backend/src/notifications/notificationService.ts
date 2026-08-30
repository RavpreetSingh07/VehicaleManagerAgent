import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

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
// REGISTER + SAVE PUSH TOKEN
// --------------------------------

export async function registerForPushNotificationsAsync() {
  try {
    // --------------------------------
    // ANDROID NOTIFICATION CHANNEL
    // --------------------------------

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

    // --------------------------------
    // CHECK PERMISSION
    // --------------------------------

    const {
      status: existingStatus,
    } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

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

    // --------------------------------
    // GET EXPO PROJECT ID
    // --------------------------------

    const projectId =
      Constants.expoConfig?.extra?.eas
        ?.projectId;

    if (!projectId) {
      console.log(
        'Expo project ID not found.'
      );

      return null;
    }

    // --------------------------------
    // GET EXPO PUSH TOKEN
    // --------------------------------

    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const expoPushToken = token.data;

    console.log(
      'VMA Expo Push Token:',
      expoPushToken
    );

    // --------------------------------
    // GET CURRENT USER
    // --------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log(
        'Could not get current user:',
        userError.message
      );

      return expoPushToken;
    }

    if (!user) {
      console.log(
        'No logged-in user. Token not saved yet.'
      );

      return expoPushToken;
    }

    // --------------------------------
    // SAVE TOKEN TO SUPABASE
    // --------------------------------

    const {
      error: saveError,
    } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: user.id,
          expo_push_token: expoPushToken,
          device_type:
            Platform.OS,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            'user_id,expo_push_token',
        }
      );

    if (saveError) {
      console.log(
        'Push token save error:',
        saveError.message
      );

      return expoPushToken;
    }

    console.log(
      'VMA push token saved to Supabase.'
    );

    return expoPushToken;
  } catch (error) {
    console.log(
      'Push notification registration error:',
      error
    );

    return null;
  }
}