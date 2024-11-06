import React from 'react';
import { InputWithLabel } from './InputWithLabel';


export interface TextWithLabelProps {
    label: string | React.ReactNode;
    value?: string | React.ReactNode | undefined;
    className?: string | undefined;
    footer?: React.ReactNode | undefined;
    postElement?: React.ReactNode | undefined;
    classNameLabel?: string | undefined;
    classNameValue?: string | undefined;
}

export const TextWithLabel: React.FC<TextWithLabelProps> = (props) => {

    return (
        <InputWithLabel className={props.className} label={props.label} inputElement={props.value} footer={props.footer} postElement={props.postElement} classNameLabel={props.classNameLabel} classNameValue={props.classNameValue}/>
    );
};

