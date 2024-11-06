import React, { PropsWithChildren } from 'react';
import { TextProps } from './index';


export const OFieldValue: React.FC<PropsWithChildren & TextProps> = (props) => {
    return <div className={"text-base " + props.className} style={Object.assign({}, props.style)}>{props.children}</div>
};
