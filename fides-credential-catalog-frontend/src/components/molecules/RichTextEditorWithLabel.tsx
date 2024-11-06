import React from 'react';
import { InputWithLabel } from './InputWithLabel';
import { RichTextEditor, RichTextEditorProps } from './RichTextEditor';


export interface RichTextEditorWithLabelProps extends RichTextEditorProps {
    label: string;
    className?: string | undefined;
}

export const RichTextEditorWithLabel: React.FC<RichTextEditorWithLabelProps> = (props) => {

    return (
        <InputWithLabel className={props.className} label={props.label} inputElement={
            <RichTextEditor onChangeValue={props.onChangeValue} value={props.value} placeHolder={props.placeHolder}/>
        }/>
    );
};

