import React, { PropsWithChildren } from 'react';

interface InputPanelProps {
    className?: string | undefined;
    style?: React.CSSProperties | undefined;
    title?: string | undefined;
}

export const InputPanel: React.FC<InputPanelProps & PropsWithChildren> = (props) => {
    return (
        <div className={'flex flex-column justify-content-start align-items-start align-self-stretch ' + props.className} style={Object.assign({backgroundColor: 'rgba(255, 255, 255, 0.80)', paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderRadius: 16}, props.style)}>
            {props.title ? <div className="flex flex-column justify-content-center align-items-start align-self-stretch gap-1 text-xs font-normal" style={{color: 'rgba(28, 28, 28, 0.40)'}}>{props.title}</div> : <></> }
            {props.children}
        </div>
    );
};


