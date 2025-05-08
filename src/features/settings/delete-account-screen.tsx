import * as React from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/theme-context';
import { Button } from '@/components/ui/button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type SettingsStackParamList = {
  Settings: undefined;
  DeleteAccount: undefined;
};

type DeleteAccountScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<DeleteAccountScreenNavigationProp>();
  const [confirmation, setConfirmation] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = () => {
    if (confirmation !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Success', 'Your account has been deleted');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>    
      <ScrollView style={styles.content}>
        <View style={styles.warningBox}>
          <Icon name="alert-circle-outline" size={32} color={colors.status.error} style={{ marginBottom: 8 }} />
          <Text style={[styles.warningTitle, { color: colors.status.error }]}>Delete Account</Text>
          <Text style={[styles.warningText, { color: colors.text.primary }]}>This action is irreversible. All your data will be permanently deleted:</Text>
          <View style={styles.warningList}>
            <Text style={[styles.warningItem, { color: colors.text.secondary }]}>• Tasks and projects</Text>
            <Text style={[styles.warningItem, { color: colors.text.secondary }]}>• Email categorization data</Text>
            <Text style={[styles.warningItem, { color: colors.text.secondary }]}>• App settings and preferences</Text>
            <Text style={[styles.warningItem, { color: colors.text.secondary }]}>• Cached email content</Text>
          </View>
          <Text style={[styles.warningNote, { color: colors.text.secondary }]}>Your Google account will not be affected.</Text>
        </View>
        <View style={styles.confirmSection}>
          <Text style={[styles.confirmText, { color: colors.text.primary }]}>Type <Text style={{ fontWeight: 'bold' }}>'DELETE'</Text> to confirm:</Text>
          <TextInput
            style={[styles.input, { color: colors.text.primary, borderColor: colors.border.medium }]}
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="DELETE"
            placeholderTextColor={colors.text.secondary}
            editable={!isDeleting}
          />
        </View>
        <Button
          variant="danger"
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={confirmation !== 'DELETE' || isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </Button>
        <Button
          variant="secondary"
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  warningBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    marginBottom: 12,
  },
  warningList: {
    marginBottom: 12,
  },
  warningItem: {
    fontSize: 14,
    marginBottom: 8,
  },
  warningNote: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  deleteButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
}); 