import * as React from 'react';
import { View as RNView, ViewProps } from 'react-native';

export type Props = ViewProps;

export function View(props: Props) {
  return <RNView {...props} />;
} 