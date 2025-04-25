import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskAttachment } from '@/types/task';
import { FileAttachment } from './file-attachment';
import { FileDownloader } from './file-downloader';

type FileAttachmentsListProps = {
  attachments: TaskAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onAddAttachment?: () => void;
  isEditable?: boolean;
  maxVisible?: number;
}

export function FileAttachmentsList({
  attachments,
  onRemoveAttachment,
  onAddAttachment,
  isEditable = false,
  maxVisible = 3
}: FileAttachmentsListProps) {
  const { colors } = useTheme();
  const [showAll, setShowAll] = React.useState(false);
  
  const visibleAttachments = showAll ? attachments : attachments.slice(0, maxVisible);
  const hasMoreAttachments = attachments.length > maxVisible;
  
  const toggleShowAll = () => {
    setShowAll(prev => !prev);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Attachments ({attachments.length})
        </Text>
        
        {isEditable && onAddAttachment && (
          <TouchableOpacity 
            onPress={onAddAttachment}
            style={[styles.addButton, { backgroundColor: colors.brand.light }]}
          >
            <Icon name="add" size={16} color={colors.brand.primary} />
            <Text style={[styles.addButtonText, { color: colors.brand.primary }]}>
              Add
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {attachments.length === 0 ? (
        <View style={[styles.emptyContainer, { borderColor: colors.border.light }]}>
          <Icon name="attach-file" size={24} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            No attachments
          </Text>
        </View>
      ) : (
        <View>
          {visibleAttachments.map(attachment => 
            attachment.isUploading ? (
              <FileAttachment
                key={attachment.id}
                id={attachment.id}
                name={attachment.name}
                type={attachment.type}
                size={attachment.size}
                uri={attachment.uri}
                isUploading={true}
                uploadProgress={50} // This would come from your upload progress state
                showRemoveButton={isEditable}
                onRemove={isEditable ? onRemoveAttachment : undefined}
              />
            ) : (
              <FileDownloader
                key={attachment.id}
                id={attachment.id}
                name={attachment.name}
                type={attachment.type}
                size={attachment.size}
                downloadUrl={attachment.downloadUrl || ''}
              />
            )
          )}
          
          {hasMoreAttachments && (
            <TouchableOpacity 
              onPress={toggleShowAll}
              style={[styles.showMoreButton, { borderColor: colors.border.light }]}
            >
              <Text style={[styles.showMoreText, { color: colors.brand.primary }]}>
                {showAll ? 'Show Less' : `Show ${attachments.length - maxVisible} More`}
              </Text>
              <Icon 
                name={showAll ? 'expand-less' : 'expand-more'} 
                size={18} 
                color={colors.brand.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
}); 