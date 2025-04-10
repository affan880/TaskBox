import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { useTheme } from '../../../theme/theme-context';
import RenderHtml, { 
  HTMLElementModel, 
  HTMLContentModel,
  MixedStyleRecord,
  CustomRenderer,
  TRenderEngineProvider,
  TRenderEngineConfig,
  TNode,
  TChildrenRenderer,
  RenderHTMLProps
} from 'react-native-render-html';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HtmlContentRendererProps {
  html: string;
}

export function HtmlContentRenderer({ html }: HtmlContentRendererProps) {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const { width } = Dimensions.get('window');
  const contentWidth = width - 32; // Account for padding

  if (!html) {
    return (
      <Text style={[styles.emptyContent, { color: colors.text.secondary }]}>
        This email doesn't contain any content.
      </Text>
    );
  }

  // For plain text emails
  if (!html.includes('<') || !html.includes('>')) {
    return (
      <Text style={[styles.plainText, { color: colors.text.primary }]}>
        {html}
      </Text>
    );
  }

  // Process HTML to improve formatting
  const processedHtml = html
    // Add spaces around list items for better rendering
    .replace(/<li>/g, '<li style="margin-bottom: 8px">')
    // Make blockquotes look nice
    .replace(/<blockquote/g, '<blockquote style="border-left: 3px solid ' + colors.brand.secondary + '; padding-left: 12px; margin: 16px 0; color: ' + colors.text.secondary + ';"')
    // Add spacing after paragraphs
    .replace(/<p>/g, '<p style="margin-bottom: 14px">')
    // Style tables
    .replace(/<table/g, '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;"')
    .replace(/<th/g, '<th style="border: 1px solid #ddd; padding: 8px; background-color: ' + (isDark ? '#333' : '#f2f2f2') + ';"')
    .replace(/<td/g, '<td style="border: 1px solid #ddd; padding: 8px;"')
    // Style pre and code
    .replace(/<pre/g, '<pre style="background-color: ' + (isDark ? '#2d2d2d' : '#f7f7f7') + '; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 16px 0;"')
    .replace(/<code/g, '<code style="font-family: monospace; background-color: ' + (isDark ? '#444' : '#f0f0f0') + '; padding: 2px 4px; border-radius: 2px;"');

  // Define base styles for HTML elements based on Gmail's appearance
  const baseStyle = {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  // Custom renderers with proper typing
  const renderers = {
    img: ({ 
      TDefaultRenderer, 
      ...props 
    }: CustomRenderer<any>) => {
      const { tnode } = props;
      const { src, alt, width: imgWidth, height: imgHeight } = tnode.attributes || {};
      
      // Check if this is an image URL we can render
      if (!src || typeof src !== 'string' || src.startsWith('cid:') || src.startsWith('data:')) {
        return (
          <View style={styles.imageWrapper}>
            <View style={[styles.imageErrorContainer, { backgroundColor: colors.background.secondary }]}>
              <Icon name="broken-image" size={24} color={colors.text.secondary} />
              <Text style={[styles.imageErrorText, { color: colors.text.secondary }]}>
                {alt || 'Image could not be loaded'}
              </Text>
            </View>
          </View>
        );
      }

      // Calculate dimensions for the image
      let aspectRatio = 1.5; // Default aspect ratio
      let calculatedHeight = 200; // Default height
      
      if (imgWidth && imgHeight) {
        aspectRatio = Number(imgWidth) / Number(imgHeight);
        calculatedHeight = contentWidth / aspectRatio;
      }

      // Gmail-style image rendering
      return (
        <View style={styles.imageWrapper}>
          <TDefaultRenderer
            {...props}
            style={{
              width: contentWidth,
              height: calculatedHeight,
              resizeMode: 'contain',
            }}
          />
        </View>
      );
    },
    table: ({ 
      TDefaultRenderer, 
      ...props 
    }: CustomRenderer<any>) => {
      // Gmail-style table rendering
      return (
        <View style={[styles.tableWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
          <TDefaultRenderer {...props} />
        </View>
      );
    },
    a: ({ 
      TDefaultRenderer, 
      ...props 
    }: CustomRenderer<any>) => {
      const { tnode } = props;
      const { href } = tnode.attributes || {};

      // Skip rendering anchors without href
      if (!href) {
        return <TDefaultRenderer {...props} />;
      }

      // Handle mailto: links specially
      const isMailto = typeof href === 'string' && href.startsWith('mailto:');
      
      // Get the link text
      let linkText = '';
      if (tnode.children && tnode.children.length > 0) {
        // Try to extract text content from children
        try {
          linkText = tnode.children
            .map((child: any) => child.data || '')
            .join('')
            .trim();
        } catch (e) {
          // If extraction fails, use the href
          linkText = isMailto ? href.substring(7) : href as string;
        }
      }

      // For empty text, use the href
      if (!linkText) {
        linkText = isMailto ? href.substring(7) : href as string;
      }

      return (
        <View style={styles.linkWrapper}>
          {isMailto ? (
            <View style={styles.emailLinkContainer}>
              <Icon name="email" size={16} color={colors.brand.primary} style={styles.emailLinkIcon} />
              <Text 
                style={[styles.emailLinkText, { color: colors.brand.primary }]}
                onPress={() => Linking.openURL(href as string)}
              >
                {linkText}
              </Text>
            </View>
          ) : (
            <Text 
              style={[styles.linkText, { color: colors.brand.primary }]}
              onPress={() => Linking.openURL(href as string)}
            >
              {linkText}
            </Text>
          )}
        </View>
      );
    },
  };

  // Define tag styles similar to Gmail
  const tagsStyles: Record<string, any> = {
    body: {
      color: colors.text.primary,
      fontSize: 16,
      lineHeight: 24,
    },
    a: {
      color: colors.brand.primary,
      textDecorationLine: 'underline' as const,
    },
    h1: {
      fontSize: 22,
      fontWeight: 'bold',
      marginVertical: 14,
      letterSpacing: 0.3,
      color: colors.text.primary,
    },
    h2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 12,
      letterSpacing: 0.2,
      color: colors.text.primary,
    },
    h3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 10,
      color: colors.text.primary,
    },
    h4: {
      fontSize: 17,
      fontWeight: 'bold',
      marginVertical: 8,
      color: colors.text.primary,
    },
    h5: {
      fontSize: 16,
      fontWeight: 'bold',
      marginVertical: 6,
      color: colors.text.primary,
    },
    h6: {
      fontSize: 15,
      fontWeight: 'bold',
      marginVertical: 4,
      color: colors.text.primary,
    },
    p: {
      marginBottom: 14,
      fontSize: 16,
      lineHeight: 24,
    },
    ul: {
      marginBottom: 14,
    },
    ol: {
      marginBottom: 14,
    },
    li: {
      marginBottom: 8,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.brand.secondary,
      paddingLeft: 12,
      marginVertical: 14,
      marginHorizontal: 4,
      fontStyle: 'italic',
    },
    pre: {
      backgroundColor: isDark ? '#2d2d2d' : '#f7f7f7',
      padding: 12,
      borderRadius: 4,
      marginVertical: 14,
    },
    code: {
      fontFamily: 'monospace',
      backgroundColor: isDark ? '#444' : '#f0f0f0',
      padding: 2,
      borderRadius: 2,
    },
    hr: {
      height: 1,
      backgroundColor: colors.border.light,
      marginVertical: 16,
    },
    img: {
      marginVertical: 14,
      alignSelf: 'center',
    },
    table: {
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ddd',
      marginVertical: 14,
    },
    th: {
      backgroundColor: isDark ? '#333' : '#f2f2f2',
      padding: 8,
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ddd',
    },
    td: {
      padding: 8,
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ddd',
    },
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading email...
          </Text>
        </View>
      )}
      
      <RenderHtml
        contentWidth={contentWidth}
        source={{ html: processedHtml }}
        baseStyle={baseStyle}
        tagsStyles={tagsStyles}
        renderers={renderers}
        defaultTextProps={{
          selectable: true,
        }}
        onTTreeChange={() => setIsLoading(false)}
        customHTMLElementModels={{
          table: HTMLElementModel.fromCustomModel({
            tagName: 'table',
            contentModel: HTMLContentModel.block,
          }),
          td: HTMLElementModel.fromCustomModel({
            tagName: 'td',
            contentModel: HTMLContentModel.block,
          }),
          th: HTMLElementModel.fromCustomModel({
            tagName: 'th',
            contentModel: HTMLContentModel.block,
          }),
          tr: HTMLElementModel.fromCustomModel({
            tagName: 'tr',
            contentModel: HTMLContentModel.block,
          }),
        }}
        renderersProps={{
          img: {
            enableExperimentalPercentWidth: true,
          },
          a: {
            onPress: (_, href) => {
              Linking.openURL(href);
              return false;
            },
          },
        }}
        systemFonts={['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']}
        enableExperimentalMarginCollapsing={true}
        enableExperimentalBRCollapsing={true}
        enableExperimentalGhostLinesPrevention={true}
        fallbackFonts={{
          serif: 'Times New Roman',
          'sans-serif': 'Arial',
          monospace: 'Courier New',
        }}
        defaultViewProps={{
          style: { marginVertical: 8 },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContent: {
    fontSize: 16,
    fontStyle: 'italic',
    padding: 16,
  },
  plainText: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  imageWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 12,
  },
  imageErrorContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  tableWrapper: {
    borderRadius: 6,
    padding: 2,
    marginVertical: 14,
  },
  linkWrapper: {
    marginVertical: 2,
  },
  linkText: {
    textDecorationLine: 'underline',
    lineHeight: 24,
  },
  emailLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailLinkIcon: {
    marginRight: 4,
  },
  emailLinkText: {
    textDecorationLine: 'underline',
  },
}); 