import * as React from 'react';
import { StyleSheet, ImageProps as RNImageProps, StyleProp, ImageStyle, NativeSyntheticEvent, ImageErrorEventData, ImageLoadEventData, Image as RNImage } from 'react-native';
import FastImage, { ImageStyle as FastImageStyle } from 'react-native-fast-image';
import { useTheme } from '../../theme/theme-context';

// Define our own content fit type to match ExpoImage's accepted values
type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

export interface ImageProps extends Omit<RNImageProps, 'source'> {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  /**
   * Whether to show a placeholder while the image is loading
   */
  withPlaceholder?: boolean;
  /**
   * Placeholder color when withPlaceholder is true
   */
  placeholderColor?: string;
  /**
   * Content fit mode for the image (maps to resizeMode)
   */
  contentFit?: ImageContentFit;
}

export function Image({
  source,
  style,
  resizeMode = 'cover',
  withPlaceholder = false,
  placeholderColor,
  contentFit,
  onLoad,
  onLoadEnd,
  onError,
  ...props
}: ImageProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = React.useState(withPlaceholder);
  
  // For local images (which come as numbers), use regular Image component
  const isLocalImage = typeof source === 'number';
  
  // Handle remote URI source
  const imageSource = React.useMemo(() => {
    if (isLocalImage) {
      return source;
    }
    
    return { uri: source.uri };
  }, [source, isLocalImage]);
  
  const combinedStyle = React.useMemo(() => {
    return [styles.base, style];
  }, [style]);
  
  // Handle loading state and placeholder
  const placeholderStyle = React.useMemo(() => {
    if (!withPlaceholder || !isLoading) return {};
    
    return {
      backgroundColor: placeholderColor || colors.background.secondary,
    };
  }, [withPlaceholder, isLoading, placeholderColor, colors.background.secondary]);

  // Map React Native's resizeMode to FastImage's resizeMode
  const fastImageResizeMode = React.useMemo(() => {
    switch (resizeMode) {
      case 'cover': return FastImage.resizeMode.cover;
      case 'contain': return FastImage.resizeMode.contain;
      case 'stretch': return FastImage.resizeMode.stretch;
      case 'center': return FastImage.resizeMode.center;
      default: return FastImage.resizeMode.cover;
    }
  }, [resizeMode]);
  
  // Use React Native's Image component for local images
  if (isLocalImage) {
    return (
      <RNImage
        source={imageSource as number}
        style={combinedStyle}
        resizeMode={resizeMode}
        onLoad={onLoad}
        onLoadEnd={onLoadEnd}
        onError={onError}
        {...props}
      />
    );
  }
  
  // Handle events for FastImage
  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    if (onLoad) {
      // FastImage doesn't pass the event object by default
      onLoad({} as NativeSyntheticEvent<ImageLoadEventData>);
    }
    if (onLoadEnd) {
      onLoadEnd();
    }
  }, [onLoad, onLoadEnd]);
  
  // Extract only the props that are compatible with FastImage
  const { 
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    testID,
    onLoadStart
  } = props;
  
  const fastImageProps = {
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    testID,
    onLoadStart
  };
  
  // Use FastImage for remote images
  return (
    <FastImage
      source={imageSource as { uri: string }}
      style={combinedStyle as StyleProp<FastImageStyle>}
      resizeMode={fastImageResizeMode}
      onLoad={handleLoad}
      onError={() => {
        if (onError) {
          onError({} as NativeSyntheticEvent<ImageErrorEventData>);
        }
        if (onLoadEnd) {
          onLoadEnd();
        }
      }}
      {...fastImageProps}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
}); 