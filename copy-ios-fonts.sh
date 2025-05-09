#!/bin/bash

echo "Copying Material Community Icons font to iOS app..."

# Create the fonts directory if it doesn't exist
mkdir -p ios/Plexar/Fonts

# Find the Material Community Icons font in node_modules
FONT_PATH="node_modules/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"

if [ -f "$FONT_PATH" ]; then
  # Copy the font to the iOS app
  cp "$FONT_PATH" ios/Plexar/Fonts/
  echo "Successfully copied MaterialCommunityIcons.ttf to ios/Plexar/Fonts/"
else
  echo "Error: Could not find $FONT_PATH"
  exit 1
fi

echo "Make sure to update your Info.plist to include the font:"
echo "Add UIAppFonts array with item MaterialCommunityIcons.ttf"
echo "Done!" 