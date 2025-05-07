import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import { useAuthStore } from '@/store/slices/auth-slice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const user = useAuthStore(state => state.user);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [bio, setBio] = React.useState(user?.bio || '');
  const [website, setWebsite] = React.useState(user?.website || '');
  const [location, setLocation] = React.useState(user?.location || '');
  const [photoURL, setPhotoURL] = React.useState(user?.photoURL);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = React.useState(false);

  const handleUpdatePhoto = React.useCallback(async () => {
    const options = {
      mediaType: 'photo' as const,
      quality: 1,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
    };

    try {
      const result = await ImagePicker.launchImageLibrary(options);
      
      if (result.didCancel) return;
      
      if (result.errorCode) {
        toast.show({
          message: result.errorMessage || 'Failed to select image',
          type: 'error'
        });
        return;
      }

      if (result.assets && result.assets[0]) {
        setIsUpdatingPhoto(true);
        const asset = result.assets[0];
        
        // TODO: Implement photo upload logic here
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPhotoURL(asset.uri);
        
        toast.show({
          message: 'Profile photo updated successfully',
          type: 'success'
        });
      }
    } catch (error) {
      toast.show({
        message: 'Failed to update profile photo',
        type: 'error'
      });
    } finally {
      setIsUpdatingPhoto(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement profile update logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.show({
        message: 'Profile updated successfully',
        type: 'success'
      });
      navigation.goBack();
    } catch (error) {
      toast.show({
        message: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={[styles.header, { 
        borderBottomColor: colors.border.light,
        backgroundColor: colors.background.primary 
      }]}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Edit Profile
        </Text>
        
        <Button
          variant="primary"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
        >
          Save
        </Button>
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background.primary }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={handleUpdatePhoto}
            disabled={isUpdatingPhoto}
          >
            {isUpdatingPhoto ? (
              <View style={[styles.photoPlaceholder, {
                backgroundColor: isDark ? colors.surface.primary : colors.background.secondary
              }]}>
                <ActivityIndicator color={colors.brand.primary} />
              </View>
            ) : photoURL ? (
              <Image 
                source={{ uri: photoURL }} 
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photoPlaceholder, {
                backgroundColor: isDark ? colors.surface.primary : colors.background.secondary
              }]}>
                <Icon 
                  name="account" 
                  size={40} 
                  color={colors.text.secondary} 
                />
              </View>
            )}
            <View style={[styles.editOverlay, { 
              backgroundColor: colors.brand.primary + '80',
              borderColor: isDark ? colors.surface.primary : 'white'
            }]}>
              <Icon name="camera" size={20} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { borderBottomColor: colors.border.light }]}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Name
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Add your name"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={[styles.inputContainer, { borderBottomColor: colors.border.light }]}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Bio
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Add a bio"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={[styles.inputContainer, { borderBottomColor: colors.border.light }]}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Website
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={website}
              onChangeText={setWebsite}
              placeholder="Add your website"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { borderBottomColor: colors.border.light }]}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Location
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Add your location"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    minWidth: 70,
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 4,
  },
}); 