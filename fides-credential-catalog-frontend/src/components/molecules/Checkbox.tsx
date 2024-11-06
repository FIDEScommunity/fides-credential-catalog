import React, { PropsWithChildren } from 'react';
import { CheckboxChecked } from '../atoms/icons/CheckboxChecked';
import { CheckboxUnchecked } from '../atoms/icons/CheckboxUnchecked';

interface CheckboxProps {
    className?: string | undefined;
    selected: boolean;
}

export const Checkbox: React.FC<CheckboxProps & PropsWithChildren> = (props) => {
    return (
        props.selected ? <CheckboxChecked /> : <CheckboxUnchecked />

    );
};

