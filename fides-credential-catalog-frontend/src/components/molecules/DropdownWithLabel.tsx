import React from 'react';
import { Dropdown } from 'primereact/dropdown';


export interface DropdownWithLabelProps {
    label: string;
    value?: string | undefined;
    onChangeValue: (value: string | undefined) => void;
    placeHolder?: string | undefined;
    className?: string | undefined;
    options: any[];
    optionLabel: string;
    disabled?: boolean;
}

export const DropdownWithLabel: React.FC<DropdownWithLabelProps> = (props) => {
    return (
        <div className={props.className} style={{border: 'none', borderRadius: 16, paddingLeft: 20, paddingRight: 20, paddingTop: 18, paddingBottom: 14, backgroundColor: '#ffffff'}}>
            <div className="text-xs pb-1 pl-2" style={{color: 'rgba(28, 28, 28, 0.40)'}}>{props.label}</div>
            <Dropdown value={props.value} onChange={(e) => props.onChangeValue(e.value)}
                      options={props.options} optionLabel={props.optionLabel}
                      placeholder="Select a type"
                      className="w-full md:w-14rem"
                      checkmark={true}
                      highlightOnSelect={false}
                      disabled={props.disabled}/>
        </div>
    );
};

