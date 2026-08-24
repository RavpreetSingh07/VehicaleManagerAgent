import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function WelcomeScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const connectedOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = async () => {
      await new Promise<void>((resolve) => {
        Animated.sequence([
          // VMA appears
          Animated.parallel([
            Animated.timing(logoOpacity, {
              toValue: 1,
              duration: 900,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),

            Animated.spring(logoScale, {
              toValue: 1,
              friction: 7,
              tension: 45,
              useNativeDriver: true,
            }),
          ]),

          // CONNECTED appears
          Animated.timing(connectedOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),

          // Connection animation
          Animated.timing(lineWidth, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),

          // Loading
          Animated.timing(loadingOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => resolve());
      });

      // Give the user a moment to see the finished screen
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check Supabase session
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    };

    startAnimation();
  }, []);

  return (
    <View style={styles.container}>
      {/* VMA LOGO */}

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              {
                scale: logoScale,
              },
            ],
          },
        ]}
      >
        <Text style={styles.carSymbol}>⌁</Text>

        <Text style={styles.logo}>
          VMA
        </Text>
      </Animated.View>

      {/* CONNECTED */}

      <Animated.View
        style={[
          styles.connectedContainer,
          {
            opacity: connectedOpacity,
          },
        ]}
      >
        <Text style={styles.connected}>
          CONNECTED
        </Text>

        <Animated.View
          style={[
            styles.connectionLine,
            {
              width: lineWidth.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 120],
              }),
            },
          ]}
        />

        <View style={styles.connectionDots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>

      {/* LOADING */}

      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: loadingOpacity,
          },
        ]}
      >
        <Text style={styles.loadingText}>
          LOADING
        </Text>

        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                width: lineWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoContainer: {
    alignItems: 'center',
  },

  carSymbol: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '300',
    marginBottom: -4,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 8,
  },

  connectedContainer: {
    alignItems: 'center',
    marginTop: 8,
  },

  connected: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 6,
  },

  connectionLine: {
    height: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 14,
  },

  connectionDots: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  loadingContainer: {
    position: 'absolute',
    bottom: 70,
    alignItems: 'center',
  },

  loadingText: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 10,
  },

  loadingBar: {
    width: 120,
    height: 2,
    backgroundColor: '#222222',
    overflow: 'hidden',
  },

  loadingProgress: {
    height: 2,
    backgroundColor: '#FFFFFF',
  },
});