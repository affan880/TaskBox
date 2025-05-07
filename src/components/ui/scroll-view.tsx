import * as React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps } from 'react-native';
import { styled } from 'nativewind';

const StyledScrollView = styled(RNScrollView);

export type Props = ScrollViewProps & {
  className?: string;
};

export function ScrollView(props: Props) {
  return <StyledScrollView {...props} />;
} 