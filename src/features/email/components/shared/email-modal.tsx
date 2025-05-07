import * as React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated, DimensionValue } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';
import FeatherIcon from 'react-native-vector-icons/Feather';

type EmailModalProps = {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: DimensionValue;
  width?: DimensionValue;
  showCloseButton?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  statusBarTranslucent?: boolean;
};

export function EmailModal({
  isVisible,
  onClose,
  title,
  children,
  height = '80%',
  width = '90%',
  showCloseButton = true,
  animationType = 'slide',
  transparent = true,
  statusBarTranslucent = true,
}: EmailModalProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width,
      height,
      backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.text.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
    },
    closeButton: {
      padding: 8,
      marginLeft: 8,
    },
    content: {
      flex: 1,
    },
  });

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType={animationType}
      transparent={transparent}
      statusBarTranslucent={statusBarTranslucent}
    >
      <Animated.View 
        style={[
          styles.modalContainer,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <FeatherIcon name="x" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.content}>
            {children}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
} 