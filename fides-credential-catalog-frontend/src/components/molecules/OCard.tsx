import React, { PropsWithChildren } from 'react';

interface CardProps {
    className?: string | undefined;
    style?: React.CSSProperties | undefined;
    title?: string | React.ReactNode | undefined;
    titlePrefix?: React.ReactNode | undefined;
}

export const OCard: React.FC<CardProps & PropsWithChildren> = (props) => {
    return (
        <div className={props.className} style={Object.assign({paddingTop: 24, paddingBottom: 24, backgroundColor: '#f6f6f6', borderRadius: 8, padding: 16, borderStyle: 'solid', borderWidth: '1px', borderColor: '#cfcfcf'}, props.style)}>
            {(props.titlePrefix || props.title) && (
            <div className="flex pb-4 align-items-center text-lg">
                {(props.titlePrefix) && (<>{props.titlePrefix}</>)}
                {(props.title) && (<div className="font-semibold font-">{props.title}</div>)}
            </div>
            )}
            {props.children}
        </div>
    );
};

