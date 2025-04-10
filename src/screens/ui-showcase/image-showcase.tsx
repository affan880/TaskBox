import * as React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Text, View, Image } from '../../components/ui';
import { useTheme } from '../../theme/theme-context';

type ExampleItem = {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
};

export function ImageShowcase() {
  const { colors } = useTheme();
  
  const examples: ExampleItem[] = [
    {
      id: '1',
      title: 'Basic Remote Image',
      description: 'Simple remote image with default settings',
      component: (
        <Image
          source={{ uri: 'https://picsum.photos/id/237/200/300' }}
          style={styles.image}
        />
      ),
    },
    {
      id: '2',
      title: 'With Placeholder',
      description: 'Shows a placeholder while loading',
      component: (
        <Image
          source={{ uri: 'https://picsum.photos/id/1003/200/300' }}
          style={styles.image}
          withPlaceholder
        />
      ),
    },
    {
      id: '3',
      title: 'Custom Placeholder Color',
      description: 'Custom placeholder color while loading',
      component: (
        <Image
          source={{ uri: 'https://picsum.photos/id/1015/200/300' }}
          style={styles.image}
          withPlaceholder
          placeholderColor={colors.brand.primary}
        />
      ),
    },
    {
      id: '4',
      title: 'Contain Resize Mode',
      description: 'Uses resizeMode="contain"',
      component: (
        <View style={styles.darkBg}>
          <Image
            source={{ uri: 'https://picsum.photos/id/1025/200/300' }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ),
    },
    {
      id: '5',
      title: 'Cover Resize Mode',
      description: 'Uses resizeMode="cover" (default)',
      component: (
        <Image
          source={{ uri: 'https://picsum.photos/id/1035/200/300' }}
          style={styles.image}
          resizeMode="cover"
        />
      ),
    },
    {
      id: '6',
      title: 'Remote Image as Local',
      description: 'Uses a remote image since actual local assets may not exist in demo',
      component: (
        <Image
          source={{ uri: 'https://picsum.photos/id/1074/200/300' }}
          style={styles.image}
        />
      ),
    },
    {
      id: '7',
      title: 'Rounded Image',
      description: 'Image with border radius',
      component: (
        <Image
          source={{ uri: 'https://picsum.photos/id/1074/200/300' }}
          style={[styles.image, styles.rounded]}
        />
      ),
    },
    {
      id: '8',
      title: 'Error Handling',
      description: 'Image with an invalid URL to demonstrate error handling',
      component: (
        <Image
          source={{ uri: 'https://invalid-image-url.jpg' }}
          style={styles.image}
          withPlaceholder
          placeholderColor={colors.status.error}
        />
      ),
    },
  ];
  
  const renderItem = ({ item }: { item: ExampleItem }) => (
    <View style={styles.exampleContainer}>
      <Text variant="subtitle" weight="semibold" style={styles.title}>
        {item.title}
      </Text>
      <Text variant="bodySmall" style={styles.description}>
        {item.description}
      </Text>
      <View style={styles.componentContainer}>
        {item.component}
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        data={examples}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 16,
  },
  exampleContainer: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 12,
  },
  componentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
  rounded: {
    borderRadius: 100,
  },
  darkBg: {
    backgroundColor: '#333',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 