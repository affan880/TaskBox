import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { EmailInput } from './shared';

type EmailContentProps = {
  subject: string;
  body: string;
  onSubjectChange: (text: string) => void;
  onBodyChange: (text: string) => void;
};

export function EmailContent({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: EmailContentProps) {
  const bodyInputRef = useRef<any>(null);

  const handleSubjectSubmit = () => {
    bodyInputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <EmailInput
        value={subject}
        onChangeText={onSubjectChange}
        placeholder="Subject"
        label="Subject"
        leftIcon="tag"
      />
      <View style={styles.divider} />
      <EmailInput
        value={body}
        onChangeText={onBodyChange}
        placeholder="Compose email"
        label="Message"
        leftIcon="edit-2"
        multiline
        numberOfLines={6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
  },
}); 