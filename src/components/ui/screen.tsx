import * as React from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  StatusBar,
  ScrollView,
  ViewStyle,
  ScrollViewProps,
  StyleProp
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

type Props = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  scrollViewProps?: ScrollViewProps;
};

export function Screen({ 
  children, 
  scrollable = true,
  style,
  scrollViewProps
}: Props) {
  const insets = useSafeAreaInsets();
  
  const Content = scrollable ? ScrollView : View;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background.primary}
        translucent
      />
      <KeyboardAvoidingView
        style={[styles.keyboardView]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Content
          {...scrollViewProps}
          style={[
            styles.content,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
            style,
          ]}
        >
          {children}
        </Content>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
}); 