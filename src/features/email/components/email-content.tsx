import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';
import { cssInterop } from 'nativewind';

// Use cssInterop with View
const StyledView = cssInterop(View, {
  className: 'style',
});
const StyledTextInput = cssInterop(TextInput, {
  className: 'style',
});

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
  const bodyInputRef = useRef<TextInput>(null);

  const handleSubjectSubmit = () => {
    bodyInputRef.current?.focus();
  };

  return (
    <>
      <StyledTextInput
        className="py-3 text-base"
        placeholder="Subject"
        value={subject}
        onChangeText={onSubjectChange}
        returnKeyType="next"
        onSubmitEditing={handleSubjectSubmit}
      />
      <StyledView className="h-[1px] bg-[#e5e5e5]" />
      <TextInput
        ref={bodyInputRef}
        style={{
          paddingVertical: 12,
          fontSize: 16,
          minHeight: 80,
          textAlignVertical: 'top',
        }}
        placeholder="Compose email"
        value={body}
        onChangeText={onBodyChange}
        multiline
      />
    </>
  );
} 