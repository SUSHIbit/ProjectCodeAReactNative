import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '../stores/authStore';
import { usePdfStore } from '../stores/pdfStore';
import { Button } from '../components/Button';

export const HomeScreen: React.FC = () => {
  const { user, signOut, loading: authLoading } = useAuthStore();
  const {
    currentPdf,
    uploadProgress,
    uploadLoading,
    uploadError,
    generateLoading,
    generateError,
    uploadPdf,
    generateMcqs,
    clearErrors,
  } = usePdfStore();

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadPdf(file);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick document');
    }
  };

  const handleGenerateMcqs = async () => {
    if (!currentPdf) {
      Alert.alert('Error', 'No PDF uploaded');
      return;
    }

    Alert.alert(
      'Generate Questions',
      'This will generate 10 multiple-choice questions from your PDF. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Generate',
          onPress: async () => {
            await generateMcqs(currentPdf.id);
          },
        },
      ]
    );
  };

  const handleTakeQuiz = () => {
    // Navigate to quiz screen (will be implemented in Phase 7)
    Alert.alert('Coming Soon', 'Quiz feature will be implemented in Phase 7');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>MCQ Generator</Text>
          {user && (
            <Text style={styles.email}>{user.email}</Text>
          )}
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Upload PDF</Text>

          <Button
            title="Select PDF File"
            onPress={handlePickDocument}
            disabled={uploadLoading || generateLoading}
            loading={uploadLoading}
          />

          {uploadLoading && uploadProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          )}

          {uploadError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{uploadError}</Text>
            </View>
          )}

          {currentPdf && (
            <View style={styles.pdfInfoContainer}>
              <View style={styles.successContainer}>
                <Text style={styles.successText}>✓ PDF uploaded successfully!</Text>
              </View>
              <View style={styles.pdfInfo}>
                <Text style={styles.pdfInfoLabel}>File:</Text>
                <Text style={styles.pdfInfoValue}>{currentPdf.file_name}</Text>
              </View>
              <View style={styles.pdfInfo}>
                <Text style={styles.pdfInfoLabel}>Size:</Text>
                <Text style={styles.pdfInfoValue}>{formatFileSize(currentPdf.file_size)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Generate MCQs Section */}
        {currentPdf && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Generate Questions</Text>

            <Button
              title={currentPdf.processed ? "Questions Generated ✓" : "Generate MCQs"}
              onPress={handleGenerateMcqs}
              disabled={currentPdf.processed || generateLoading || uploadLoading}
              loading={generateLoading}
              variant={currentPdf.processed ? "success" : "primary"}
            />

            {generateError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{generateError}</Text>
              </View>
            )}

            {currentPdf.processed && !generateLoading && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>✓ 10 questions generated successfully!</Text>
              </View>
            )}
          </View>
        )}

        {/* Take Quiz Section */}
        {currentPdf && currentPdf.processed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Take Quiz</Text>

            <Button
              title="Start Quiz"
              onPress={handleTakeQuiz}
              disabled={generateLoading || uploadLoading}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          loading={authLoading}
          disabled={authLoading || uploadLoading || generateLoading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  successContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  pdfInfoContainer: {
    marginTop: 16,
  },
  pdfInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  pdfInfoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  pdfInfoValue: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#F2F2F7',
  },
});
