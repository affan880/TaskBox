import * as React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskData } from '@/types/task';
import { TaskShareModal } from './task-share-modal';

type TaskShareButtonProps = {
  task: TaskData;
  style?: StyleProp<ViewStyle>;
  size?: number;
};

export function TaskShareButton({ task, style, size = 16 }: TaskShareButtonProps) {
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false);
  
  const handleOpenShareModal = () => {
    setIsModalVisible(true);
  };
  
  const handleCloseShareModal = () => {
    setIsModalVisible(false);
  };
  
  return (
    <>
      <TouchableOpacity 
        style={style || styles.button}
        onPress={handleOpenShareModal}
      >
        <Icon name="share" size={size} color="#555" />
      </TouchableOpacity>
      
      <TaskShareModal 
        isVisible={isModalVisible}
        onClose={handleCloseShareModal}
        task={task}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#4285F4',
    borderRadius: 20,
  },
}); 