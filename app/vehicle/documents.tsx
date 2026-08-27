import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type DocumentEntry = {
  id: string;
  document_type: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  created_at: string;
};

const DOCUMENT_TYPES = ['RC', 'Insurance', 'PUC'];

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [documentType, setDocumentType] = useState('RC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // --------------------------------
  // LOAD DOCUMENTS
  // --------------------------------

  const loadDocuments = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('vehicle_documents')
        .select(
          'id, document_type, document_number, issue_date, expiry_date, document_url, created_at'
        )
        .eq('user_id', user.id)
        .order('expiry_date', {
          ascending: true,
        });

      if (error) {
        console.log(
          'Documents loading error:',
          error.message
        );
      } else {
        setDocuments(
          (data || []) as DocumentEntry[]
        );
      }
    } catch (error) {
      console.log(
        'Documents error:',
        error
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // --------------------------------
  // PICK DOCUMENT
  // --------------------------------

  const pickDocument = async () => {
    setMessage('');

    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            'image/*',
            'application/pdf',
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      setSelectedFile(file);

      setMessage(
        `Selected: ${file.name}`
      );
    } catch (error) {
      console.log(
        'Document picker error:',
        error
      );

      setMessage(
        'Could not select the document.'
      );
    }
  };

  // --------------------------------
  // DOCUMENT STATUS
  // --------------------------------

  const getDocumentStatus = (
    expiryDate: string | null
  ) => {
    if (!expiryDate) {
      return {
        text: 'NO EXPIRY',
        style: styles.statusNeutral,
      };
    }

    const today = new Date();

    const expiry = new Date(
      `${expiryDate}T23:59:59`
    );

    const difference =
      expiry.getTime() - today.getTime();

    const daysLeft = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      return {
        text: 'EXPIRED',
        style: styles.statusExpired,
      };
    }

    if (daysLeft <= 30) {
      return {
        text: `${daysLeft} DAYS LEFT`,
        style: styles.statusWarning,
      };
    }

    return {
      text: 'VALID',
      style: styles.statusValid,
    };
  };

  // --------------------------------
  // SAVE DOCUMENT
  // --------------------------------

  const saveDocument = async () => {
    setMessage('');

    if (!documentType || !expiryDate) {
      setMessage(
        'Please select a document type and expiry date.'
      );
      return;
    }

    if (!selectedFile) {
      setMessage(
        'Please select an image or PDF.'
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          'Please log in again.'
        );
        setSaving(false);
        return;
      }

      // --------------------------------
      // GET VEHICLE
      // --------------------------------

      const {
        data: vehicle,
        error: vehicleError,
      } = await supabase
        .from('vehicles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (vehicleError) {
        console.log(
          'Vehicle error:',
          vehicleError.message
        );
      }

      if (vehicleError || !vehicle) {
        setMessage(
          'No vehicle found.'
        );
        setSaving(false);
        return;
      }

      // --------------------------------
      // READ FILE
      // --------------------------------

      const response = await fetch(
        selectedFile.uri
      );

      if (!response.ok) {
        throw new Error(
          'Could not read selected file.'
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      // --------------------------------
      // FILE NAME
      // --------------------------------

      const safeDocumentType =
        documentType
          .replace(
            /[^a-zA-Z0-9]/g,
            '-'
          )
          .toLowerCase();

      const safeFileName =
        selectedFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '-'
        );

      const filePath =
        `${user.id}/${vehicle.id}/${Date.now()}_${safeDocumentType}_${safeFileName}`;

      console.log(
        'Uploading:',
        filePath
      );

      // --------------------------------
      // UPLOAD FILE
      // --------------------------------

      const {
        error: uploadError,
      } = await supabase.storage
        .from('vehicle-documents')
        .upload(
          filePath,
          arrayBuffer,
          {
            contentType:
              selectedFile.mimeType ||
              'application/octet-stream',
            upsert: false,
          }
        );

      if (uploadError) {
        console.log(
          'File upload error:',
          uploadError.message
        );

        setMessage(
          `Upload failed: ${uploadError.message}`
        );

        setSaving(false);
        return;
      }

      console.log(
        'Upload successful:',
        filePath
      );

      // --------------------------------
      // SAVE DATABASE RECORD
      // --------------------------------

      const {
        error: databaseError,
      } = await supabase
        .from('vehicle_documents')
        .insert({
          vehicle_id: vehicle.id,
          user_id: user.id,
          document_type: documentType,
          document_number:
            documentNumber || null,
          issue_date:
            issueDate || null,
          expiry_date: expiryDate,
          document_url: filePath,
        });

      if (databaseError) {
        console.log(
          'Database error:',
          databaseError.message
        );

        // Remove uploaded file if DB save fails
        await supabase.storage
          .from('vehicle-documents')
          .remove([filePath]);

        setMessage(
          `Save failed: ${databaseError.message}`
        );

        setSaving(false);
        return;
      }

      // --------------------------------
      // SUCCESS
      // --------------------------------

      setMessage(
        '✓ Document uploaded and saved'
      );

      setDocumentType('RC');
      setDocumentNumber('');
      setIssueDate('');
      setExpiryDate('');
      setSelectedFile(null);

      setShowAdd(false);

      await loadDocuments();
    } catch (error) {
      console.log(
        'Document save error:',
        error
      );

      setMessage(
        'Something went wrong while saving.'
      );
    }

    setSaving(false);
  };

  // --------------------------------
  // VIEW DOCUMENT
  // --------------------------------

  const viewDocument = (
    filePath: string | null,
    documentType?: string
  ) => {
    if (!filePath) {
      Alert.alert(
        'No document',
        'No file has been uploaded for this document.'
      );
      return;
    }

    const fileName =
      filePath.split('/').pop() ||
      'Document';

    router.push({
      pathname:
        '/vehicle/document-viewer',
      params: {
        path: filePath,
        type: documentType || '',
        name: fileName,
      },
    });
  };

  // --------------------------------
  // DELETE DOCUMENT
  // --------------------------------

  const deleteDocument = (
    document: DocumentEntry
  ) => {
    Alert.alert(
      'Delete Document?',
      `Are you sure you want to delete this ${document.document_type} document?\n\nThis will permanently remove the document and its uploaded file.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setMessage('');

            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                Alert.alert(
                  'Session expired',
                  'Please log in again.'
                );
                return;
              }

              // --------------------------------
              // DELETE STORAGE FILE
              // --------------------------------

              if (document.document_url) {
                const {
                  error: storageError,
                } = await supabase.storage
                  .from('vehicle-documents')
                  .remove([
                    document.document_url,
                  ]);

                if (storageError) {
                  console.log(
                    'Storage delete error:',
                    storageError.message
                  );

                  Alert.alert(
                    'Delete failed',
                    `Could not delete the uploaded file: ${storageError.message}`
                  );

                  return;
                }
              }

              // --------------------------------
              // DELETE DATABASE RECORD
              // --------------------------------

              const {
                error: databaseError,
              } = await supabase
                .from('vehicle_documents')
                .delete()
                .eq('id', document.id)
                .eq('user_id', user.id);

              if (databaseError) {
                console.log(
                  'Database delete error:',
                  databaseError.message
                );

                Alert.alert(
                  'Delete failed',
                  databaseError.message
                );

                return;
              }

              // --------------------------------
              // UPDATE SCREEN
              // --------------------------------

              setDocuments((current) =>
                current.filter(
                  (item) =>
                    item.id !== document.id
                )
              );

              Alert.alert(
                'Deleted',
                `${document.document_type} has been deleted successfully.`
              );
            } catch (error) {
              console.log(
                'Delete document error:',
                error
              );

              Alert.alert(
                'Delete failed',
                'Something went wrong while deleting the document.'
              );
            }
          },
        },
      ]
    );
  };

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          color="#FFFFFF"
          size="large"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

          <Text style={styles.headerTitle}>
            Documents
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {/* INTRO */}

        <Text style={styles.title}>
          Vehicle Documents
        </Text>

        <Text style={styles.subtitle}>
          Keep your RC, insurance and PUC
          information organized in one place.
        </Text>

        {/* SUMMARY */}

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>
              DOCUMENTS
            </Text>

            <Text style={styles.summaryValue}>
              {documents.length}
            </Text>
          </View>

          <View
            style={styles.summaryDivider}
          />

          <View>
            <Text style={styles.summaryLabel}>
              ATTENTION
            </Text>

            <Text style={styles.summaryValue}>
              {
                documents.filter(
                  (doc) => {
                    const status =
                      getDocumentStatus(
                        doc.expiry_date
                      );

                    return (
                      status.text ===
                        'EXPIRED' ||
                      status.text.includes(
                        'DAYS LEFT'
                      )
                    );
                  }
                ).length
              }
            </Text>
          </View>
        </View>

        {/* ADD BUTTON */}

        <Pressable
          style={styles.addButton}
          onPress={() => {
            setMessage('');
            setShowAdd(!showAdd);
          }}
        >
          <Text
            style={
              styles.addButtonText
            }
          >
            {showAdd
              ? 'Close'
              : '+ Add Document'}
          </Text>

          <Text
            style={styles.addArrow}
          >
            {showAdd ? '×' : '→'}
          </Text>
        </Pressable>

        {/* ADD FORM */}

        {showAdd && (
          <View style={styles.formCard}>

            <Text style={styles.formTitle}>
              New Document
            </Text>

            <Text style={styles.inputLabel}>
              DOCUMENT TYPE
            </Text>

            <View style={styles.typeRow}>
              {DOCUMENT_TYPES.map(
                (type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeButton,
                      documentType ===
                        type &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setDocumentType(
                        type
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.typeText,
                        documentType ===
                          type &&
                          styles.typeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Text style={styles.inputLabel}>
              DOCUMENT NUMBER
            </Text>

            <TextInput
              value={documentNumber}
              onChangeText={
                setDocumentNumber
              }
              placeholder="Optional"
              placeholderTextColor="#555"
              style={styles.input}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>
              ISSUE DATE
            </Text>

            <TextInput
              value={issueDate}
              onChangeText={
                setIssueDate
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#555"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              EXPIRY DATE
            </Text>

            <TextInput
              value={expiryDate}
              onChangeText={
                setExpiryDate
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#555"
              style={styles.input}
            />

            {/* FILE PICKER */}

            <Text style={styles.inputLabel}>
              DOCUMENT FILE
            </Text>

            <Pressable
              style={styles.fileButton}
              onPress={pickDocument}
            >
              <Text
                style={styles.fileIcon}
              >
                📎
              </Text>

              <View
                style={styles.fileInfo}
              >
                <Text
                  style={styles.fileTitle}
                >
                  {selectedFile
                    ? 'File selected'
                    : 'Choose image or PDF'}
                </Text>

                <Text
                  style={styles.fileSubtitle}
                  numberOfLines={1}
                >
                  {selectedFile
                    ? selectedFile.name
                    : 'RC • Insurance • PUC'}
                </Text>
              </View>

              <Text
                style={styles.fileArrow}
              >
                →
              </Text>
            </Pressable>

            {/* SAVE */}

            <Pressable
              style={styles.saveButton}
              onPress={saveDocument}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color="#000000"
                />
              ) : (
                <Text
                  style={styles.saveText}
                >
                  Upload & Save
                </Text>
              )}
            </Pressable>

            {message !== '' && (
              <Text
                style={styles.message}
              >
                {message}
              </Text>
            )}

          </View>
        )}

        {/* DOCUMENT LIST */}

        <View style={styles.listHeader}>
          <Text
            style={styles.sectionTitle}
          >
            Your Documents
          </Text>

          {documents.length > 0 && (
            <Text style={styles.count}>
              {documents.length}
            </Text>
          )}
        </View>

        {documents.length === 0 ? (

          <View style={styles.emptyCard}>

            <Text
              style={styles.emptyIcon}
            >
              📄
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No documents yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              Add your RC, insurance or PUC
              to start tracking expiry dates.
            </Text>

          </View>

        ) : (

          documents.map(
            (document) => {

              const status =
                getDocumentStatus(
                  document.expiry_date
                );

              return (
                <View
                  key={document.id}
                  style={
                    styles.documentCard
                  }
                >

                  {/* TOP */}

                  <View
                    style={
                      styles.documentTop
                    }
                  >

                    <View
                      style={
                        styles.documentIcon
                      }
                    >
                      <Text
                        style={
                          styles.documentEmoji
                        }
                      >
                        {document.document_type ===
                        'Insurance'
                          ? '🛡️'
                          : document.document_type ===
                            'PUC'
                          ? '🌱'
                          : '📄'}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.documentInfo
                      }
                    >
                      <Text
                        style={
                          styles.documentType
                        }
                      >
                        {document.document_type}
                      </Text>

                      <Text
                        style={
                          styles.documentNumber
                        }
                      >
                        {document.document_number ||
                          'Number not added'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        status.style,
                      ]}
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {status.text}
                      </Text>
                    </View>

                  </View>

                  {/* DATES */}

                  <View
                    style={
                      styles.dateDivider
                    }
                  />

                  <View
                    style={styles.dateRow}
                  >

                    <View>
                      <Text
                        style={
                          styles.dateLabel
                        }
                      >
                        ISSUE DATE
                      </Text>

                      <Text
                        style={
                          styles.dateValue
                        }
                      >
                        {document.issue_date ||
                          '-'}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.expiryContainer
                      }
                    >
                      <Text
                        style={
                          styles.dateLabel
                        }
                      >
                        EXPIRY DATE
                      </Text>

                      <Text
                        style={
                          styles.dateValue
                        }
                      >
                        {document.expiry_date ||
                          '-'}
                      </Text>
                    </View>

                  </View>

                  {/* VIEW DOCUMENT */}

                  {document.document_url && (
                    <Pressable
                      style={
                        styles.viewButton
                      }
                      onPress={() =>
                        viewDocument(
                          document.document_url,
                          document.document_type
                        )
                      }
                    >
                      <Text
                        style={
                          styles.viewButtonText
                        }
                      >
                        View Document
                      </Text>

                      <Text
                        style={
                          styles.viewArrow
                        }
                      >
                        →
                      </Text>
                    </Pressable>
                  )}

                  {/* DELETE DOCUMENT */}

                  <Pressable
                    style={
                      styles.deleteButton
                    }
                    onPress={() =>
                      deleteDocument(
                        document
                      )
                    }
                  >
                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      Delete Document
                    </Text>
                  </Pressable>

                </View>
              );
            }
          )

        )}

        {/* INFO */}

        <View style={styles.infoCard}>

          <Text
            style={styles.infoTitle}
          >
            VMA DOCUMENT TRACKING
          </Text>

          <Text
            style={styles.infoText}
          >
            Your documents are stored securely.
            VMA will show you when a document
            is valid, expiring soon or already
            expired.
          </Text>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  loading: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
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

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 42,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },

  summaryCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 23,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292929',
  },

  summaryLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  summaryValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 5,
  },

  summaryDivider: {
    width: 1,
    height: 55,
    backgroundColor: '#292929',
    marginHorizontal: 45,
  },

  addButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    marginTop: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },

  addArrow: {
    color: '#000000',
    fontSize: 25,
  },

  formCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#292929',
  },

  formTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  inputLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 8,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  typeButton: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },

  typeText: {
    color: '#777777',
    fontSize: 13,
    fontWeight: '700',
  },

  typeTextActive: {
    color: '#000000',
  },

  input: {
    height: 52,
    backgroundColor: '#191919',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
  },

  fileButton: {
    minHeight: 65,
    backgroundColor: '#191919',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileIcon: {
    fontSize: 22,
  },

  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  fileTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  fileSubtitle: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
  },

  fileArrow: {
    color: '#FFFFFF',
    fontSize: 20,
  },

  saveButton: {
    height: 55,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  saveText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },

  message: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 30,
    marginBottom: 15,
  },

  count: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 30,
  },

  emptyCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292929',
  },

  emptyIcon: {
    fontSize: 32,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },

  documentCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#292929',
  },

  documentTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  documentEmoji: {
    fontSize: 21,
  },

  documentInfo: {
    flex: 1,
    marginLeft: 13,
  },

  documentType: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  documentNumber: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  statusValid: {
    backgroundColor: '#202020',
  },

  statusWarning: {
    backgroundColor: '#2A2A2A',
  },

  statusExpired: {
    backgroundColor: '#3A3A3A',
  },

  statusNeutral: {
    backgroundColor: '#191919',
  },

  dateDivider: {
    height: 1,
    backgroundColor: '#292929',
    marginVertical: 18,
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  expiryContainer: {
    alignItems: 'flex-end',
  },

  dateLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  dateValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },

  viewButton: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    marginTop: 18,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  viewButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },

  viewArrow: {
    color: '#000000',
    fontSize: 20,
  },

  // DELETE BUTTON — RED

  deleteButton: {
    height: 46,
    backgroundColor: '#2A0D0D',
    borderRadius: 13,
    marginTop: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5A2020',
  },

  deleteButtonText: {
    color: '#FF4D4D',
    fontSize: 13,
    fontWeight: '700',
  },

  infoCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 22,
    padding: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#222222',
  },

  infoTitle: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  infoText: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});