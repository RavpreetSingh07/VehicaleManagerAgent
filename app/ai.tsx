import { useState } from 'react';
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
  role: 'user' | 'assistant';
  content: string;
};

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hey 👋 I’m VMA AI. Ask me anything about your vehicle.',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    setInput('');

    const userMessage: Message = {
      role: 'user',
      content: text,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke('vma-ai', {
          body: {
            messages: updatedMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          },
        });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            data?.answer || 'I could not generate a response.',
        },
      ]);
    } catch (error) {
      console.error('VMA AI error:', error);

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            error instanceof Error
              ? `AI error: ${error.message}`
              : 'Something went wrong.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>VMA AI</Text>
        <Text style={styles.subtitle}>
          Your vehicle assistant
        </Text>
      </View>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === 'user'
                ? styles.userBubble
                : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === 'user'
                  ? styles.userText
                  : styles.aiText,
              ]}
            >
              {message.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.aiBubble}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your car..."
          placeholderTextColor="#666666"
          style={styles.input}
          multiline
          editable={!loading}
          onSubmitEditing={sendMessage}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!input.trim() || loading) &&
              styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  header: {
    paddingTop: 65,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },

  subtitle: {
    color: '#666666',
    fontSize: 14,
    marginTop: 4,
  },

  messages: {
    flex: 1,
  },

  messagesContent: {
    padding: 20,
    paddingBottom: 30,
  },

  messageBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
  },

  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },

  aiText: {
    color: '#FFFFFF',
  },

  userText: {
    color: '#000000',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    gap: 10,
  },

  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    backgroundColor: '#111111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },

  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.4,
  },

  sendText: {
    color: '#000000',
    fontSize: 25,
    fontWeight: '900',
  },
});