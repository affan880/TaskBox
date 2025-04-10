/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Our brand colors
        primary: "#788bff",
        secondary: "#7189ff",
        raspberry: "#d81e5b",
        
        // Base colors
        alabaster: {
          DEFAULT: '#f1f1e4',
          100: '#3e3e20',
          200: '#7c7c40',
          300: '#b1b168',
          400: '#d1d1a6',
          500: '#f1f1e4',
          600: '#f4f4e9',
          700: '#f7f7ef',
          800: '#f9f9f4',
          900: '#fcfcfa'
        },
        
        primaryBlue: {
          DEFAULT: '#788bff',
          100: '#080d33',
          200: '#101a66',
          300: '#172799',
          400: '#1f34cc',
          500: '#4c62ff',
          600: '#788bff',
          700: '#96a3ff',
          800: '#b4bcff',
          900: '#d7daff'
        },
        
        cornflowerBlue: {
          DEFAULT: '#7189ff',
          100: '#000c49',
          200: '#001893',
          300: '#0025dc',
          400: '#274bff',
          500: '#7189ff',
          600: '#8da0ff',
          700: '#a9b8ff',
          800: '#c6cfff',
          900: '#e2e7ff' 
        },
        
        dimGray: {
          DEFAULT: '#666b6a',
          100: '#141515',
          200: '#292b2a',
          300: '#3d403f',
          400: '#525555',
          500: '#666b6a',
          600: '#848988',
          700: '#a3a7a6',
          800: '#c2c4c4',
          900: '#e0e2e1'
        },
        
        night: {
          DEFAULT: '#090c08',
          100: '#020202',
          200: '#040503',
          300: '#060705',
          400: '#070a07',
          500: '#090c08',
          600: '#35472f',
          700: '#618256',
          800: '#93b189',
          900: '#c9d8c4'
        },
        
        danger: "#e74c3c",
        warning: "#f39c12",
        success: "#4CAF50"
      }
    },
  },
  plugins: [],
}

