import * as React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  Text, 
  ActivityIndicator, 
  View,
  StyleSheet 
} from 'react-native';
import { classNames } from '../../utils/styling';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  // Create styles based on variant and size
  const getStyles = () => {
    // Define base styles
    const baseStyles = styles.button;
    
    // Variant-specific styles
    const variantStyles = {
      primary: styles.primaryButton,
      secondary: styles.secondaryButton,
      outline: styles.outlineButton,
      ghost: styles.ghostButton,
      danger: styles.dangerButton,
    };
    
    // Size-specific styles
    const sizeStyles = {
      sm: styles.smallButton,
      md: styles.mediumButton,
      lg: styles.largeButton,
    };
    
    // Text styles
    const baseTextStyle = styles.buttonText;
    const variantTextStyles = {
      primary: styles.primaryText,
      secondary: styles.primaryText,
      outline: styles.outlineText,
      ghost: styles.ghostText,
      danger: styles.primaryText,
    };
    const sizeTextStyles = {
      sm: styles.smallText,
      md: styles.mediumText,
      lg: styles.largeText,
    };

    // Combined button style
    const buttonStyle = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      disabled || isLoading ? styles.disabledButton : null,
      style, // Add custom style passed as prop
    ];

    // Combined text style
    const textStyle = [
      baseTextStyle,
      variantTextStyles[variant],
      sizeTextStyles[size],
    ];

    return { buttonStyle, textStyle };
  };

  const { buttonStyle, textStyle } = getStyles();

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || isLoading}
      {...props}
    >
      <View style={styles.contentContainer}>
        {isLoading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'ghost' ? '#3498db' : '#fff'} 
            style={styles.iconLeft}
          />
        ) : leftIcon ? (
          <View style={styles.iconLeft}>{leftIcon}</View>
        ) : null}
        
        {typeof children === 'string' ? (
          <Text style={textStyle}>{children}</Text>
        ) : (
          children
        )}
        
        {rightIcon && !isLoading ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: '#3498db', // primary color
  },
  secondaryButton: {
    backgroundColor: '#2ecc71', // secondary color
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#cbd5e1', // neutral-300
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: '#e74c3c', // danger color
  },
  disabledButton: {
    opacity: 0.5,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mediumButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
  },
  primaryText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#1e293b', // neutral-800
  },
  ghostText: {
    color: '#3498db', // primary color
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
}); 