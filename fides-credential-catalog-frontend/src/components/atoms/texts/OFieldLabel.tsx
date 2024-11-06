import React, { PropsWithChildren } from 'react';
import { TextProps } from './index';


export const OFieldLabel: React.FC<PropsWithChildren & TextProps> = (props) => {
    return <div className={"text-base " + props.className} style={Object.assign({color: 'var(--black-200)'}, props.style)}>{props.children}</div>
};
