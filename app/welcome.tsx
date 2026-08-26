import { supabase } from '@/lib/supabase';
import { ResizeMode, Video } from 'expo-av';
import { router } from 'expo-router';
import { useRef } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

export default function WelcomeScreen() {
  const hasFinished = useRef(false);

  const handleVideoFinish = async () => {
    // Prevent the function from running twice
    if (hasFinished.current) {
      return;
    }

    hasFinished.current = true;

    // Check if user is already logged in
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <Video
        source={require('../assets/images/intro.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (
            status.isLoaded &&
            status.didJustFinish
          ) {
            handleVideoFinish();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  video: {
    width: '100%',
    height: '100%',
  },
});