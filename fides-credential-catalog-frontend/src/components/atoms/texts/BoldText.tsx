import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { DEFAULT_TEXT_COLOR } from './colors';

interface Props {
    color?: string;
    truncate?: boolean;
    children?: ReactNode;
}

export const BoldText: React.FC<Props> = ({color = DEFAULT_TEXT_COLOR, truncate = true, children}) => {
    return <MyText $color={color}>{children}</MyText>;
};

const MyText = styled.h1<{
    $color: string
}>`
  color: $color;
  font-size: 32px;
  font-weight: bold;
`;
