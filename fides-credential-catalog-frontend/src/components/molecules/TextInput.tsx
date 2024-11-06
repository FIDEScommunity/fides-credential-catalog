import React, { useMemo } from 'react';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';


export interface TextInputProps {
    value?: string | undefined;
    onChangeValue?: (value: string | undefined) => void;
    placeHolder?: string | undefined;
    className?: string | undefined;
    inputIconClass?: string;
    onIconClicked?: (value: string | undefined) => void;
    iconPosition?: 'left' | 'right' | undefined;
}

export const TextInput: React.FC<TextInputProps> = (props) => {


    const iconPosition = useMemo(() => {
        return (props.iconPosition === undefined) ? 'right' : props.iconPosition;
    }, [props.iconPosition]);

    return (
        <IconField iconPosition={iconPosition} className={props.className}>
            {/*{(props.inputIconClass !== undefined) && (*/}
            {/*    <InputIcon className={props.inputIconClass} onClick={() => (props.onIconClicked !== undefined) && props.onIconClicked(props.value)}> </InputIcon>*/}
            {/*)}*/}
            <InputText className="w-full"
                       value={props.value}
                       onChange={(e) => (props.onChangeValue !== undefined) && props.onChangeValue(e.target.value)}
                       placeholder={props.placeHolder}/>
        </IconField>
    );
};

