import * as React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps } from 'react-native';

export type Props = ScrollViewProps;

export function ScrollView(props: Props) {
  return <RNScrollView {...props} />;
} 