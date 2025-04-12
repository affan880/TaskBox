import React, { useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Dimensions, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from 'src/theme/theme-context';

type AutoHeightWebViewProps = {
  html: string;
  baseUrl?: string;
};

export function AutoHeightWebView({ html, baseUrl }: AutoHeightWebViewProps) {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [webViewHeight, setWebViewHeight] = useState(300);
  const webViewRef = useRef<WebView>(null);

  if (!html) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: colors.text.secondary }}>
          This email doesn't contain any content.
        </Text>
      </View>
    );
  }

  // Process HTML to ensure proper image loading and styling
  const processedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: ${isDark ? '#ffffff' : '#202124'};
            background-color: ${isDark ? '#2C2C2E' : '#FFFFFF'};
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
          }
          * {
            max-width: 100%;
            margin-bottom: 0;
          }
          div {
            max-width: 100%;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
            display: inline-block;
          }
          a {
            color: ${colors.brand.primary};
            text-decoration: underline;
          }
          p {
            padding: 0;
          }
          h1, h2, h3, h4, h5, h6 {
            color: ${isDark ? '#ffffff' : '#202124'};
            font-weight: bold;
          }
          h1 { font-size: 24px; }
          h2 { font-size: 20px; color: ${isDark ? '#ffffff' : '#1a73e8'}; }
          h3 { font-size: 18px; }
          li {
            margin-bottom: 8px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table th, table td {
            text-align: left;
          }
          table th {
            background-color: ${isDark ? '#333333' : '#f2f2f2'};
          }
        </style>
      </head>
      <body>
        <div id="content" >
          ${html}
        </div>
        <script>
          // Ensure all images load properly
          document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.display = 'inline-block';
              
              // Force reload of image
              const originalSrc = img.src;
              if (originalSrc) {
                img.src = '';
                img.src = originalSrc;
              }
            });
          });

          // Calculate height
          function updateHeight() {
            const height = document.documentElement.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'heightUpdate', height: height }));
          }
          
          // Call once page is loaded
          window.addEventListener('load', updateHeight);
          
          // Call after slight delay to ensure images are loaded
          setTimeout(updateHeight, 500);
        </script>
      </body>
    </html>
  `;

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'heightUpdate') {
        setWebViewHeight(data.height);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
          <Text style={{ color: colors.text.secondary, marginTop: 8 }}>
            Loading email content...
          </Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ html: processedHtml, baseUrl }}
        style={[styles.webView, { height: webViewHeight }]}
        originWhitelist={['*']}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={(event) => {
          // Handle link clicks
          if (event.url && event.url !== 'about:blank' && !event.url.startsWith('data:')) {
            Linking.openURL(event.url);
            return false;
          }
          return true;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    minHeight: 100,
  },
  webView: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emptyContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 