import cors from 'cors';
import express from 'express';

import { supabaseAdmin } from './config/supabase';
import {
  sendPushNotification,
} from './notifications/notificationService';

const app = express();

app.use(cors());
app.use(express.json());

// --------------------------------
// BASIC BACKEND TEST
// --------------------------------

app.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'VMA backend is running',
  });
});

// --------------------------------
// SUPABASE CONNECTION TEST
// --------------------------------

app.get(
  '/supabase-test',
  async (_req, res) => {
    try {
      const { error } =
        await supabaseAdmin
          .from('push_tokens')
          .select('user_id')
          .limit(1);

      if (error) {
        console.error(
          'Supabase test error:',
          error.message
        );

        return res.status(500).json({
          status: 'error',
          message: error.message,
        });
      }

      return res.json({
        status: 'success',
        message:
          'Docker backend can access Supabase.',
      });
    } catch (error) {
      console.error(
        'Supabase test error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Supabase connection failed.',
      });
    }
  }
);

// --------------------------------
// TEST PUSH NOTIFICATION
// --------------------------------

app.post(
  '/notifications/test',
  async (req, res) => {
    try {
      const {
        expoPushToken,
      } = req.body;

      if (
        !expoPushToken ||
        typeof expoPushToken !== 'string'
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'expoPushToken is required.',
        });
      }

      const result =
        await sendPushNotification({
          expoPushToken,
          title: 'VMA Test 🚗',
          body:
            'This notification was sent by the VMA Docker backend.',
          data: {
            type: 'test',
          },
        });

      return res.json({
        status: 'success',
        message:
          'Notification sent to Expo Push Service.',
        result,
      });
    } catch (error) {
      console.error(
        'Notification error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Notification failed.',
      });
    }
  }
);

// --------------------------------
// START SERVER
// --------------------------------

app.listen(
  3000,
  '0.0.0.0',
  () => {
    console.log(
      'VMA backend running on port 3000'
    );
  }
);