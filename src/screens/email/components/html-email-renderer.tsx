import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../theme/theme-context';

type HtmlEmailRendererProps = {
  html: string;
};

export function HtmlEmailRenderer({ html }: HtmlEmailRendererProps) {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [webViewHeight, setWebViewHeight] = useState(300);
  const { width } = Dimensions.get('window');
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

  // Inject JavaScript to get the content height and clean up borders
  const injectedJavaScript = `
    // Force images to load and display properly
    function fixImages() {
      const images = document.querySelectorAll('img');
      let imgCount = images.length;
      let loadedCount = 0;
      
      // If no images, just proceed
      if (imgCount === 0) {
        adjustHeight();
        return;
      }
      
      images.forEach((img) => {
        // Force proper image styling
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'inline-block';
        
        // Handle image load success
        img.onload = function() {
          loadedCount++;
          if (loadedCount >= imgCount) {
            adjustHeight();
          }
        };
        
        // Handle image load failure
        img.onerror = function() {
          // Replace broken image with placeholder
          img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADy0lEQVR4nO2aS0hUURjHf87kpDOa2kNnessUFRXRg16LIKKg1qFBRZAQFbTIXZt2QVC0C9pEtCgiCmoRPaRdUFAQVItemEHRBpqaZnqa8nrF+S7XXObOPR73zr3n3vtfnDlz7nznfP/vfN+cM+eCx+PxeDwej8fjLoVT0FESUA6sBFYBy4GlQAnwAxgEngK9wEugH5ieikDypaCh/QWKTIJKgCagCVgHzDOc+wUYAO4D14GHwIyNoJ0UoAJoBdqAH8BvQx+3/F4NHADOAf3AFDAOdAJNwFJgQb6KoA5qBx4D04YEbcUfAk4DY7r9S7+H/HbNwCdDfGMG/zEvgFrgpi9YFVm2F3gPXAE69SryKbAFqARykwmgYPxEZSJYW5EHmoDrUbwP/b6bgXna/ohD58rj93Mj8FkVIZcCmKbAaWA4SWHCnruAVmCB9nndx0bpqkQzzSB+r92sBHWQOqcTkHlBlf4q7sU7INdkPJdJrDFi7p/Q52/R+8LCHEnGBm+5XQpKtSGMcO4qU5/vxPeYB7SzPQcDOOUGKT7Lv/kq8cXTQdcAvY9X5FoAFZdOq0Q9wGuLTpuB7cBj7XhY9IUQT5XGUqNKKEvdH8sO64FdwHvRKHcBwPFZFGCnYWdbkWvXG9E6oUrZYdEpGrfGCkQppoAHQI0hkXInjqepKM1VxQ3xv01i3Ql4I2aOKHQ0aaVF4U4l4IUpESv3Cy06hYMm4aT8r4/6uRvYasHBFmD/P8bTGn5OcXgQKFfXLuRaANnHOx+3/y/WIXBcXRcq3PgEpH7+ERTAWLVW1yUKl17FFeOxTKHpf+bnE8BXdV1hYR2eE1SBpELhU5t7MQx8U9e1CjcFkJr+kP46ZQo3BQhSIfFGYR6d0o0TuRYgfMEhF1IZ0g2/AFMYtb9dqlD5Q6aRfX8W2R2KRYl2hk4HVJxbgM8WEi0CLgGXY2xfODFlYRCKuhOkOG3KF8zT2w76LZEb9LZgUuM7E6Q4a8oXnPVbjvqNJ4ALwB2gDliit6szTPGwsQhZGsSiQOHGDpCLEtmkULgZAiF6AWSzqUrhbgUIoVQILTfWKvKvAoSoPqBB4X5DrCqP9b0lCrcFCAcv68JpsL5eJcPeDlPLbGVFvtUFUXApPQ9sU4RvkSnsF0Ba3KchZmhM+xIUTAJLhYVRw+QWvTbI2IuUw8lCKFnMSrA7nLNXoBT2k19cYnIE3uPxeDwej8fjyWX+AJ2Y3/sWO5/pAAAAAElFTkSuQmCC';
          
          // Count as loaded
          loadedCount++;
          if (loadedCount >= imgCount) {
            adjustHeight();
          }
        };
        
        // Force load of image
        const originalSrc = img.src;
        img.src = '';
        img.src = originalSrc;
      });
    }
    
    // Remove all borders and styling issues
    function cleanStyles() {
      const allElements = document.querySelectorAll('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        
        // Remove borders, backgrounds, box-shadows
        element.style.border = 'none';
        element.style.boxShadow = 'none';
        element.style.backgroundColor = 'transparent';
        
        // For divs, normalize spacing
        if (element.tagName === 'DIV') {
          if (!element.classList.contains('email-container')) {
            element.style.margin = '0';
            element.style.padding = '0';
          }
        }
        
        // Fix paragraph spacing
        if (element.tagName === 'P') {
          element.style.marginTop = '0';
          element.style.marginBottom = '16px';
          element.style.lineHeight = '1.5';
        }
        
        // Fix headings
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
          element.style.marginTop = '24px';
          element.style.marginBottom = '16px';
          element.style.lineHeight = '1.3';
          element.style.fontWeight = 'bold';
        }
        
        // Fix lists
        if (element.tagName === 'LI') {
          element.style.marginBottom = '8px';
        }
        
        // Set width to 100% for layout divs
        if (element.tagName === 'DIV' && element.clientWidth > 0) {
          element.style.width = '100%';
        }
      }
    }
    
    // Calculate and set the height
    function adjustHeight() {
      cleanStyles();
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'heightChange',
        height: document.documentElement.scrollHeight
      }));
    }
    
    // Initial cleanup
    cleanStyles();
    
    // Handle clicks on all links
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentNode;
      }
      if (target && target.tagName === 'A') {
        e.preventDefault();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'linkClicked',
          href: target.href
        }));
        return false;
      }
    }, false);
    
    // Fix images once document is loaded
    if (document.readyState === 'complete') {
      fixImages();
    } else {
      document.addEventListener('DOMContentLoaded', fixImages);
    }
    
    // Fallback for height calculation
    setTimeout(function() {
      adjustHeight();
    }, 500);
    
    true;
  `;

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'heightChange') {
        setWebViewHeight(data.height);
      } else if (data.type === 'linkClicked') {
        Linking.openURL(data.href);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  // Clean the HTML - remove unnecessary nested containers that cause borders
  const cleanHtml = (html: string) => {
    if (!html) return '';
    
    // First replace all border and background styling
    let cleaned = html
      // Remove all border attributes
      .replace(/border=["'][^"']*["']/gi, 'border="0"')
      .replace(/border-width:[^;]+;/gi, 'border-width:0;')
      .replace(/border-style:[^;]+;/gi, 'border-style:none;')
      .replace(/border-color:[^;]+;/gi, 'border-color:transparent;')
      .replace(/border:[^;]+;/gi, 'border:none;')
      .replace(/border-top:[^;]+;/gi, 'border-top:none;')
      .replace(/border-bottom:[^;]+;/gi, 'border-bottom:none;')
      .replace(/border-left:[^;]+;/gi, 'border-left:none;')
      .replace(/border-right:[^;]+;/gi, 'border-right:none;')
      
      // Remove all backgrounds on divs
      .replace(/background-color:[^;]+;/gi, 'background-color:transparent;')
      .replace(/background:[^;]+;/gi, 'background:transparent;')
      
      // Remove margin and padding from divs
      .replace(/margin:[^;]+;/gi, 'margin:0;')
      .replace(/padding:[^;]+;/gi, 'padding:0;')
      
      // Flatten box-shadow
      .replace(/box-shadow:[^;]+;/gi, 'box-shadow:none;')
      
      // Fix img tags to ensure they load properly
      .replace(/<img([^>]*)>/gi, (match, attributes) => {
        // Add loading="eager" and decoding="async" to images
        return `<img ${attributes} loading="eager" decoding="async">`;
      })
      
      // Remove all cellpadding, cellspacing, and border from tables
      .replace(/<table[^>]*>/gi, '<table border="0" cellpadding="0" cellspacing="0" style="border:none;border-collapse:collapse;">');
    
    // Remove width constraints on divs
    cleaned = cleaned.replace(/<div[^>]*style="[^"]*width:[^;]+;[^"]*"[^>]*>/gi, (match) => {
      return match.replace(/width:[^;]+;/gi, 'width:100%;');
    });
    
    return cleaned;
  };

  // Prepare HTML with responsive viewport and styling
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
          border: none;
          background-color: ${isDark ? '#2C2C2E' : '#FFFFFF'};
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: ${isDark ? '#ffffff' : '#202124'};
          font-size: 16px;
          line-height: 1.5;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }
        
        * {
          box-sizing: border-box;
          border: none !important;
          box-shadow: none !important;
          background-color: transparent !important;
        }
        
        .email-container {
          padding: 16px;
          width: 100%;
          background-color: transparent;
          border: none;
        }
        
        div {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 4px;
          margin: 8px 0;
          display: inline-block;
        }
        
        a {
          color: ${colors.brand.primary};
          text-decoration: underline;
        }
        
        pre {
          background-color: ${isDark ? '#2d2d2d' : '#f5f5f5'} !important;
          padding: 12px;
          border-radius: 4px;
          overflow: auto;
          font-family: monospace;
          white-space: pre-wrap;
          margin: 16px 0;
        }
        
        code {
          font-family: monospace;
          background-color: ${isDark ? '#333333' : '#f0f0f0'} !important;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        blockquote {
          border-left: 3px solid ${colors.brand.secondary} !important;
          padding-left: 12px;
          margin-left: 0;
          margin-right: 0;
          color: ${isDark ? '#cccccc' : '#5f6368'};
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
          table-layout: fixed;
          border: none !important;
        }
        
        th, td {
          border: 1px solid ${isDark ? '#444444' : '#e0e0e0'};
          padding: 8px;
          text-align: left;
          word-break: break-word;
        }
        
        th {
          background-color: ${isDark ? '#333333' : '#f2f2f2'} !important;
        }
        
        /* Gmail-style paragraph spacing */
        p {
          margin: 0 0 16px 0;
          line-height: 1.5;
        }
        
        /* Gmail-style headings */
        h1, h2, h3, h4, h5, h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          line-height: 1.3;
          font-weight: bold;
          color: ${isDark ? '#ffffff' : '#202124'};
        }
        
        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        
        /* Gmail-style lists */
        ul, ol {
          margin: 16px 0;
          padding-left: 24px;
        }
        
        li {
          margin-bottom: 8px;
        }
        
        /* Gmail-style horizontal rule */
        hr {
          height: 1px;
          background-color: ${isDark ? '#444' : '#e0e0e0'} !important;
          border: none !important;
          margin: 24px 0;
        }
        
        /* Gallery styling for images side by side */
        .gallery {
          display: flex;
          flex-wrap: wrap;
          border: none;
          background: transparent;
        }
        
        .gallery-item {
          flex: 0 0 25%;
          max-width: 25%;
          padding: 5px;
          margin: 0;
          border: none;
          background: transparent;
        }
        
        .gallery-icon {
          margin: 0;
          border: none;
          background: transparent;
        }
        
        .gallery-icon img {
          width: 100%;
          height: auto;
          margin: 0;
        }
        
        .gallery-columns-2 .gallery-item {
          flex: 0 0 50%;
          max-width: 50%;
        }
        
        .gallery-columns-3 .gallery-item {
          flex: 0 0 33.333%;
          max-width: 33.333%;
        }
        
        .gallery-columns-4 .gallery-item {
          flex: 0 0 25%;
          max-width: 25%;
        }
        
        /* Fix for nested divs */
        * > div, * > table, * > tr, * > td {
          border: none !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${cleanHtml(html)}
      </div>
    </body>
    </html>
  `;

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
        source={{ html: htmlContent }}
        style={[styles.webView, { height: webViewHeight }]}
        originWhitelist={['*']}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentInset={{top: 0, left: 0, bottom: 0, right: 0}}
        automaticallyAdjustContentInsets={false}
        hideKeyboardAccessoryView={true}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        mixedContentMode="compatibility"
        androidLayerType="hardware"
        scalesPageToFit={Platform.OS === 'android'}
        containerStyle={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  webView: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 