import * as React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';

export function EmptyProjectList() {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyList}>
      <FeatherIcon name="folder" size={48} color={colors.text.secondary} />
      <Text style={[styles.emptyListText, { color: colors.text.secondary }]}>
        No projects found. Create your first project!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    transform: [{ rotate: '-1deg' }],
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    transform: [{ rotate: '2deg' }],
  },
}); 