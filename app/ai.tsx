import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function AiScreen() {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const [messages, setMessages] =
    useState<Message[]>([
      {
        id: 'welcome',
        role: 'assistant',
        text:
          "Hey! I'm VMA. Ask me anything about your vehicle.",
      },
    ]);

  // --------------------------------
  // SPEECH EVENTS
  // --------------------------------

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript =
      event.results?.[0]?.transcript || '';

    if (transcript) {
      setInput(transcript);
    }

    if (event.isFinal && transcript.trim()) {
      setInput('');
      sendMessage(transcript.trim());
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log(
      'Speech recognition error:',
      event.error,
      event.message
    );

    setListening(false);
  });

  // --------------------------------
  // STOP SPEAKING WHEN LEAVING
  // --------------------------------

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // --------------------------------
  // SEND TO NVIDIA
  // --------------------------------

  const sendMessage = async (
    messageText?: string
  ) => {
    const text = (
      messageText ?? input
    ).trim();

    if (!text || sending) {
      return;
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      text,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    try {
      const apiMessages =
        updatedMessages.map(
          (message) => ({
            role: message.role,
            content: message.text,
          })
        );

      const {
        data,
        error,
      } = await supabase.functions.invoke(
        'vma-ai',
        {
          body: {
            messages: apiMessages,
          },
        }
      );

      if (error) {
        throw new Error(
          error.message ||
            'AI request failed.'
        );
      }

      if (data?.error) {
        throw new Error(
          data.error
        );
      }

      const answer =
        data?.answer?.trim();

      if (!answer) {
        throw new Error(
          'AI returned an empty response.'
        );
      }

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      // Speak AI response
      await speakAnswer(answer);
    } catch (error) {
      console.log(
        'VMA AI error:',
        error
      );

      const errorText =
        'I could not connect to VMA AI right now. Please try again.';

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: errorText,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // --------------------------------
  // TEXT TO SPEECH
  // --------------------------------

  const speakAnswer = async (
    text: string
  ) => {
    try {
      await Speech.stop();

      setSpeaking(true);

      Speech.speak(text, {
        language: 'en-IN',
        pitch: 1.0,
        rate: 0.95,
        onDone: () => {
          setSpeaking(false);
        },
        onStopped: () => {
          setSpeaking(false);
        },
        onError: () => {
          setSpeaking(false);
        },
      });
    } catch (error) {
      console.log(
        'Speech output error:',
        error
      );

      setSpeaking(false);
    }
  };

  // --------------------------------
  // START LISTENING
  // --------------------------------

  const startVoice = async () => {
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        console.log(
          'Speech permission denied'
        );
        return;
      }

      await Speech.stop();
      setSpeaking(false);

      ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (error) {
      console.log(
        'Voice start error:',
        error
      );
    }
  };

  // --------------------------------
  // STOP LISTENING
  // --------------------------------

  const stopVoice = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  // --------------------------------
  // TOGGLE VOICE
  // --------------------------------

  const toggleVoice = () => {
    if (listening) {
      stopVoice();
      return;
    }

    if (sending) {
      return;
    }

    startVoice();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            VMA AI
          </Text>

          <Text style={styles.headerSubtitle}>
            YOUR VEHICLE ASSISTANT
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* CHAT */}

      <ScrollView
        style={styles.chat}
        contentContainerStyle={
          styles.chatContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introCard}>
          <Text style={styles.introIcon}>
            ✦
          </Text>

          <Text style={styles.introTitle}>
            Ask VMA anything
          </Text>

          <Text style={styles.introText}>
            Chat or speak with VMA about your
            vehicle.
          </Text>
        </View>

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.role === 'user' &&
                styles.userMessageRow,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.role === 'user'
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}
            >
              {message.role ===
                'assistant' && (
                <Text
                  style={
                    styles.assistantLabel
                  }
                >
                  VMA
                </Text>
              )}

              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' &&
                    styles.userMessageText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}

        {sending && (
          <View style={styles.messageRow}>
            <View
              style={[
                styles.messageBubble,
                styles.assistantBubble,
              ]}
            >
              <Text
                style={styles.assistantLabel}
              >
                VMA
              </Text>

              <View
                style={
                  styles.loadingResponse
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={styles.thinkingText}
                >
                  Thinking...
                </Text>
              </View>
            </View>
          </View>
        )}

        {listening && (
          <View
            style={styles.voiceStatus}
          >
            <View
              style={styles.voicePulse}
            />

            <Text
              style={styles.voiceStatusText}
            >
              Listening...
            </Text>
          </View>
        )}

        {speaking && (
          <View
            style={styles.voiceStatus}
          >
            <View
              style={styles.speakingDot}
            />

            <Text
              style={styles.voiceStatusText}
            >
              VMA is speaking...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* INPUT */}

      <View style={styles.inputArea}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your car..."
          placeholderTextColor="#666666"
          style={styles.input}
          multiline
          maxLength={2000}
          editable={
            !sending && !listening
          }
        />

        {/* MICROPHONE */}

        <Pressable
          style={[
            styles.voiceButton,
            listening &&
              styles.voiceButtonActive,
            (sending || speaking) &&
              styles.voiceButtonDisabled,
          ]}
          onPress={toggleVoice}
          disabled={sending || speaking}
        >
          <Text style={styles.voiceIcon}>
            {listening ? '■' : '🎤'}
          </Text>
        </Pressable>

        {/* SEND */}

        <Pressable
          style={[
            styles.sendButton,
            (!input.trim() || sending) &&
              styles.sendButtonDisabled,
          ]}
          onPress={() =>
            sendMessage()
          }
          disabled={
            !input.trim() || sending
          }
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color="#000000"
            />
          ) : (
            <Text style={styles.sendIcon}>
              ↑
            </Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        VMA AI • NVIDIA Nemotron
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // --------------------------------
  // HEADER
  // --------------------------------

  header: {
    height: 90,
    paddingHorizontal: 20,
    paddingTop: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
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
    marginTop: -4,
  },

  headerCenter: {
    alignItems: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 3,
  },

  headerSpacer: {
    width: 42,
  },

  // --------------------------------
  // CHAT
  // --------------------------------

  chat: {
    flex: 1,
  },

  chatContent: {
    padding: 20,
    paddingBottom: 20,
  },

  introCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#292929',
    marginBottom: 20,
  },

  introIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    marginBottom: 10,
  },

  introTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },

  introText: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  // --------------------------------
  // MESSAGES
  // --------------------------------

  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },

  userMessageRow: {
    justifyContent: 'flex-end',
  },

  messageBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  assistantBubble: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    borderTopLeftRadius: 7,
  },

  userBubble: {
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 7,
  },

  assistantLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },

  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },

  userMessageText: {
    color: '#000000',
  },

  loadingResponse: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  thinkingText: {
    color: '#777777',
    fontSize: 13,
    marginLeft: 9,
  },

  // --------------------------------
  // VOICE STATUS
  // --------------------------------

  voiceStatus: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginTop: 6,
  },

  voicePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },

  speakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },

  voiceStatusText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600',
  },

  // --------------------------------
  // INPUT
  // --------------------------------

  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },

  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },

  voiceButton: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  voiceButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },

  voiceButtonDisabled: {
    opacity: 0.35,
  },

  voiceIcon: {
    fontSize: 20,
  },

  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.35,
  },

  sendIcon: {
    color: '#000000',
    fontSize: 25,
    fontWeight: '800',
  },

  footerText: {
    color: '#444444',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 1,
    paddingBottom: 8,
  },
});