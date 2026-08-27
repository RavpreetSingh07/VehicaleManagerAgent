import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { supabase } from '../../lib/supabase';

export default function DocumentViewerScreen() {
  const {
    path,
    type,
    name,
  } = useLocalSearchParams<{
    path: string;
    type?: string;
    name?: string;
  }>();

  const [url, setUrl] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  // --------------------------------
  // LOAD SIGNED URL
  // --------------------------------

  useEffect(() => {
    const loadDocument = async () => {
      if (!path) {
        setError(
          'Document not found.'
        );

        setLoading(false);
        return;
      }

      try {
        console.log(
          'Creating signed URL for:',
          path
        );

        const {
          data,
          error,
        } = await supabase.storage
          .from('vehicle-documents')
          .createSignedUrl(
            path,
            60 * 10
          );

        if (error) {
          console.log(
            'Signed URL error:',
            error.message
          );

          setError(
            'Unable to load document.'
          );

          setLoading(false);
          return;
        }

        if (!data?.signedUrl) {
          setError(
            'No document URL received.'
          );

          setLoading(false);
          return;
        }

        console.log(
          'Signed URL created successfully'
        );

        setUrl(data.signedUrl);
      } catch (err) {
        console.log(
          'Viewer error:',
          err
        );

        setError(
          'Something went wrong while loading the document.'
        );
      }

      setLoading(false);
    };

    loadDocument();
  }, [path]);

  // --------------------------------
  // DETECT FILE TYPE
  // --------------------------------

  const lowerPath =
    path?.toLowerCase() || '';

  const isPdf =
    type
      ?.toLowerCase()
      .includes('pdf') ||
    lowerPath.endsWith('.pdf');

  const isImage =
    !isPdf &&
    (
      lowerPath.endsWith('.jpg') ||
      lowerPath.endsWith('.jpeg') ||
      lowerPath.endsWith('.png') ||
      lowerPath.endsWith('.webp') ||
      lowerPath.endsWith('.heic')
    );

  // --------------------------------
  // SCREEN
  // --------------------------------

  return (
    <View style={styles.screen}>

      {/* HEADER */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>
            ‹
          </Text>
        </Pressable>

        <View
          style={styles.titleContainer}
        >
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {name || 'Document'}
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            VMA DOCUMENT VIEWER
          </Text>
        </View>

        <View
          style={styles.headerSpacer}
        />

      </View>

      {/* VIEWER */}

      <View style={styles.viewer}>

        {/* LOADING */}

        {loading && (
          <View style={styles.center}>

            <ActivityIndicator
              size="large"
              color="#FFFFFF"
            />

            <Text
              style={styles.loadingText}
            >
              Loading document...
            </Text>

          </View>
        )}

        {/* ERROR */}

        {!loading && error !== '' && (
          <View style={styles.center}>

            <View
              style={styles.errorIcon}
            >
              <Text
                style={
                  styles.errorIconText
                }
              >
                !
              </Text>
            </View>

            <Text
              style={styles.errorTitle}
            >
              Unable to open
            </Text>

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>

            <Pressable
              style={
                styles.backHomeButton
              }
              onPress={() =>
                router.back()
              }
            >
              <Text
                style={
                  styles.backHomeText
                }
              >
                Go Back
              </Text>
            </Pressable>

          </View>
        )}

        {/* IMAGE */}

        {!loading &&
          error === '' &&
          url &&
          isImage && (

            <Image
              source={{
                uri: url,
              }}
              style={styles.image}
              resizeMode="contain"
            />

          )}

        {/* PDF */}

        {!loading &&
          error === '' &&
          url &&
          isPdf && (

            <WebView
              source={{
                uri: url,
              }}
              style={styles.webview}
              originWhitelist={[
                '*',
              ]}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              renderLoading={() => (
                <View
                  style={
                    styles.pdfLoading
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Loading PDF...
                  </Text>
                </View>
              )}
            />

          )}

        {/* OTHER FILE */}

        {!loading &&
          error === '' &&
          url &&
          !isImage &&
          !isPdf && (

            <WebView
              source={{
                uri: url,
              }}
              style={styles.webview}
              originWhitelist={[
                '*',
              ]}
              javaScriptEnabled
              domStorageEnabled
            />

          )}

      </View>

    </View>
  );
}

// --------------------------------
// STYLES
// --------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  header: {
    height: 105,
    paddingTop:
      Platform.OS === 'ios'
        ? 50
        : 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    backgroundColor: '#050505',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4,
  },

  titleContainer: {
    flex: 1,
    marginLeft: 15,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },

  headerSpacer: {
    width: 42,
  },

  viewer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    color: '#777777',
    fontSize: 13,
    marginTop: 15,
  },

  errorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorIconText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 15,
  },

  errorText: {
    color: '#666666',
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
  },

  backHomeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 25,
    paddingVertical: 14,
    marginTop: 25,
  },

  backHomeText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },

  pdfLoading: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});