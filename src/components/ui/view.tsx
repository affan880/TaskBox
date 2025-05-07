import * as React from 'react';
import { View as RNView, ViewProps } from 'react-native';
import { styled } from 'nativewind/dist/styled';

const StyledView = styled(RNView);

export type Props = ViewProps & {
  className?: string;
};

export function View(props: Props) {
  return <StyledView {...props} />;
} 