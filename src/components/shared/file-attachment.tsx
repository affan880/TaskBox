import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { getFileIconByType } from '@/utils/validation';
import { formatFileSize } from '@/utils/formatting';

type FileAttachmentProps = {
  id: string;
  name: string;
  type: string;
  size: number;
  uri?: string;
  downloadUrl?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  onPress?: (id: string) => void;
  onRemove?: (id: string) => void;
  showRemoveButton?: boolean;
}

export function FileAttachment({
  id,
  name,
  type,
  size,
  uri,
  downloadUrl,
  isUploading = false,
  uploadProgress = 0,
  onPress,
  onRemove,
  showRemoveButton = true
}: FileAttachmentProps) {
  const { colors } = useTheme();
  
  const handlePress = () => {
    if (onPress) {
      onPress(id);
    }
  };
  
  const handleRemove = (e: any) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(id);
    }
  };
  
  const iconName = getFileIconByType(type);
  
  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={[
        styles.container,
        { borderColor: colors.border.light }
      ]}
      disabled={isUploading}
    >
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={24} color={colors.brand.primary} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text 
          style={[styles.fileName, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        
        <Text style={[styles.fileInfo, { color: colors.text.tertiary }]}>
          {formatFileSize(size)}
        </Text>
        
        {isUploading && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  backgroundColor: colors.brand.primary,
                  width: `${uploadProgress}%`
                }
              ]} 
            />
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {uploadProgress}%
            </Text>
          </View>
        )}
      </View>
      
      {isUploading ? (
        <ActivityIndicator size="small" color={colors.brand.primary} />
      ) : showRemoveButton && onRemove ? (
        <TouchableOpacity
          onPress={handleRemove}
          style={styles.removeButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="close" size={18} color={colors.status.error} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
}); 