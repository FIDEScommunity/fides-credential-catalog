import React, { FC } from 'react';
import { Message } from 'primereact/message';

interface Props {
    errorMessage: string | undefined | null
    errorCode?: string | undefined
    show: boolean
    className?: string;
}

export const ErrorAlert: FC<Props> = (props) => {
    if (!props.show) {
        return null;
    }
    return (
        <Message severity="error" className={"p-4 border-primary justify-content-start w-full " + props.className} text={props.errorMessage}/>
    )
};
