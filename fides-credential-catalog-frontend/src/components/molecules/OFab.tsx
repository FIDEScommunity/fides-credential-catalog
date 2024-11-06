import React, { PropsWithChildren } from 'react';
import { Button } from 'primereact/button';
import { OFabContainer } from './OFabContainer';

interface OFabProps {
    className?: string | undefined;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
}

export const OFab: React.FC<OFabProps & PropsWithChildren> = (props) => {
    const {disabled = false} = props;
    return (
        <OFabContainer className={props.className}><Button label="Start configuration" size="small" className="w-max" onClick={props.onClick} disabled={disabled}/></OFabContainer>
    );
};
