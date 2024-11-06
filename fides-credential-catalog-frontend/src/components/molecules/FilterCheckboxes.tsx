import { Accordion, AccordionTab } from "primereact/accordion";
import React from 'react';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import './FilterCheckboxes.css';
import { TextToHtml } from './TextToHtml';

export interface DropdownWithLabelProps {
    title: string;
    keys: string[] | undefined;
    selectedValues: string[];
    onChangeValue: (values: string[]) => void;
    labelProvider(string: string): string | React.ReactNode;
}

export const FilterCheckboxes: React.FC<DropdownWithLabelProps> = (props) => {

    const onCheckboxChange = (e: CheckboxChangeEvent) => {
        let _items = [...props.selectedValues];

        if (e.checked)
            _items.push(e.value);
        else
            _items = _items.filter(category => category !== e.value);
        props.onChangeValue(_items);
    };
    if (props.keys === undefined) {
        return null;
    }

    function getLabel(entry: string) {
        const value = props.labelProvider(entry);
        if (typeof value === 'string') {
            // Replace some characters with zero width space to allow line breaks
            return <TextToHtml value={value.replaceAll(':', ':&ZeroWidthSpace;').replaceAll('_', '_&ZeroWidthSpace;').replaceAll('-', '-&ZeroWidthSpace;')}/>
        } else {
            return value;
        }
    }

    return (<Accordion className="mt-3" activeIndex={0}>
        <AccordionTab header={props.title} className="filter-checkboxes">
            {props.keys.map((entry) => {
                return (
                    <div key={entry} className="flex align-items-top mb-1">
                        <Checkbox inputId={entry} name={entry} value={entry} onChange={event => {
                            onCheckboxChange(event)
                        }} checked={props.selectedValues.some((item) => item === entry)}/>
                        <label htmlFor={entry} className="pl-2" style={{overflowWrap: 'break-word', wordWrap: 'break-word', whiteSpace: 'pre-line', overflow: 'visible' }}>{getLabel(entry)}</label>
                    </div>
                );
            })}
        </AccordionTab>
    </Accordion>);
}

