import React, { PropsWithChildren } from 'react';
import { TextProps } from './index';


export const OH3: React.FC<PropsWithChildren & TextProps> = (props) => {
    return <div className={"text-lg font-semibold " + props.className} style={Object.assign({}, props.style)}>{props.children}</div>;
};
