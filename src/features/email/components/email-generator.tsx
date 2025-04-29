import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { useGenerateEmail } from '../hooks/use-generate-email';
import { Button } from '@/components/ui/button';

type EmailGeneratorProps = {
  onComplete?: (revisions: any[]) => void;
};

export function EmailGenerator({ onComplete }: EmailGeneratorProps) {
  const { colors, isDark } = useTheme();
  const { status, revisions, error, generateEmail, reset } = useGenerateEmail();

  React.useEffect(() => {
    if (status === 'complete' && onComplete) {
      onComplete(revisions);
    }
  }, [status, revisions, onComplete]);

  const handleGenerate = () => {
    generateEmail('Generate a professional email');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusText: {
      fontSize: 16,
      color: colors.text.secondary,
      marginLeft: 8,
    },
    revisionsContainer: {
      flex: 1,
    },
    revisionCard: {
      backgroundColor: isDark ? colors.background.secondary : colors.surface.primary,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    revisionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    revisionNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
    revisionTimestamp: {
      fontSize: 12,
      color: colors.text.tertiary,
    },
    revisionContent: {
      fontSize: 14,
      color: colors.text.primary,
      lineHeight: 20,
    },
    errorContainer: {
      backgroundColor: `${colors.status.error}20`,
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: colors.status.error,
      fontSize: 14,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Email Generator</Text>
        <View style={styles.statusContainer}>
          {status === 'generating' && (
            <>
              <ActivityIndicator color={colors.brand.primary} />
              <Text style={styles.statusText}>Generating email...</Text>
            </>
          )}
          {status === 'complete' && (
            <Text style={[styles.statusText, { color: colors.status.success }]}>
              Generation complete
            </Text>
          )}
          {status === 'error' && (
            <Text style={[styles.statusText, { color: colors.status.error }]}>
              Generation failed
            </Text>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.revisionsContainer}>
        {revisions.map((revision, index) => (
          <View key={revision.timestamp} style={styles.revisionCard}>
            <View style={styles.revisionHeader}>
              <Text style={styles.revisionNumber}>Revision {revision.revisionNumber}</Text>
              <Text style={styles.revisionTimestamp}>
                {new Date(revision.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.revisionContent}>{revision.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {status === 'idle' && (
          <Button
            onPress={handleGenerate}
            style={{ flex: 1, marginRight: 8 }}
          >
            Generate Email
          </Button>
        )}
        {status === 'complete' && (
          <Button
            onPress={reset}
            variant="outline"
            style={{ flex: 1 }}
          >
            Start New Generation
          </Button>
        )}
      </View>
    </View>
  );
} 