import React, { HTMLInputTypeAttribute } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputWithLabel } from './InputWithLabel';


export interface TextInputWithLabelProps {
    label: string;
    value?: string | undefined;
    onChangeValue: (value: string | undefined) => void;
    placeHolder?: string | undefined;
    className?: string | undefined;
    multiline?: boolean | undefined;
    inputType?: HTMLInputTypeAttribute | undefined;
    footer?: React.ReactNode | undefined;
    postElement?: React.ReactNode | undefined;
}

export const TextInputWithLabel: React.FC<TextInputWithLabelProps> = (props) => {

    const {multiline = false} = props;
    const {inputType = 'text'} = props;

    return (
        <InputWithLabel className={props.className} label={props.label} inputElement={
            <>
                {multiline ? (
                    <InputTextarea className="w-full" value={props.value} onChange={(e) => props.onChangeValue(e.target.value)} placeholder={props.placeHolder}/>
                ) : (
                    <InputText className="w-full" value={props.value}
                               onChange={(e) => props.onChangeValue(e.target.value)}
                               type={inputType}
                               placeholder={props.placeHolder}/>
                )}
            </>
        } footer={props.footer} postElement={props.postElement}/>
    );
};

