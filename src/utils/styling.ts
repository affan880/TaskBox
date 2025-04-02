/**
 * Common styling utilities and constants
 */

export const colors = {
  primary: "#3498db",
  secondary: "#2ecc71",
  danger: "#e74c3c",
  warning: "#f39c12",
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  }
};

/**
 * Conditionally join class names
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Add alpha value to hex color
 * @param hex Hex color code
 * @param alpha Alpha value (0-1)
 * @returns Hex color with alpha
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const alphaInt = Math.round(alpha * 255);
  const alphaHex = alphaInt.toString(16).padStart(2, '0');
  return `${hex}${alphaHex}`;
} 