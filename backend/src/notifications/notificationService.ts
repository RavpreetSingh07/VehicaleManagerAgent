const EXPO_PUSH_URL =
  'https://exp.host/--/api/v2/push/send';

type NotificationData = Record<
  string,
  unknown
>;

type SendNotificationOptions = {
  expoPushToken: string;
  title: string;
  body: string;
  data?: NotificationData;
};

export async function sendPushNotification({
  expoPushToken,
  title,
  body,
  data,
}: SendNotificationOptions) {
  const response = await fetch(
    EXPO_PUSH_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding':
          'gzip, deflate',
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        sound: 'default',
        data: data || {},
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Expo push request failed: ${response.status} ${JSON.stringify(result)}`
    );
  }

  const ticket =
    Array.isArray(result?.data)
      ? result.data[0]
      : result?.data;

  if (ticket?.status === 'error') {
    throw new Error(
      ticket.message ||
        'Expo Push Service returned an error.'
    );
  }

  return result;
}