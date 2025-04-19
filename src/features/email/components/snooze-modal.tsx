import * as React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@/lib/theme';
import { Clock, Calendar } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSnooze: (date: Date) => void;
};

export function SnoozeModal({ visible, onClose, onSnooze }: Props) {
  const { colors } = useTheme();
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const snapPoints = React.useMemo(() => ['50%'], []);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSnoozeOption = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    onSnooze(date);
  };

  const handleCustomSnooze = () => {
    onSnooze(selectedDate);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16, color: colors.text }}>
          Snooze Email
        </Text>

        <View style={{ gap: 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 8,
              backgroundColor: colors.gray[100],
            }}
            onPress={() => handleSnoozeOption(1)}
          >
            <Clock size={24} color={colors.text} style={{ marginRight: 12 }} />
            <Text style={{ color: colors.text }}>Later today (1 hour)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 8,
              backgroundColor: colors.gray[100],
            }}
            onPress={() => handleSnoozeOption(24)}
          >
            <Calendar size={24} color={colors.text} style={{ marginRight: 12 }} />
            <Text style={{ color: colors.text }}>Tomorrow</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 8,
              backgroundColor: colors.gray[100],
            }}
            onPress={() => handleSnoozeOption(168)}
          >
            <Calendar size={24} color={colors.text} style={{ marginRight: 12 }} />
            <Text style={{ color: colors.text }}>Next week</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 16 }}>
            <Button
              variant="outline"
              onPress={handleCustomSnooze}
              style={{ width: '100%' }}
            >
              <Text style={{ color: colors.text }}>Custom Time</Text>
            </Button>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
} 