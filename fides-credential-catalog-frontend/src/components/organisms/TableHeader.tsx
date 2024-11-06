import React, { useState } from 'react';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { useTranslation } from 'react-i18next';

interface TableHeaderProps {
    className?: string | undefined;
    onAddClicked?: () => void;
    searchPlaceHolder?: string;
    onSearch?: (value: string | undefined) => void;
}


export const TableHeader: React.FC<TableHeaderProps> = (props) => {
    const {t} = useTranslation();
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();

    const searchPlaceHolder = props.searchPlaceHolder || t('generic.search');

    function setValue(value: string | undefined) {
        if (props.onSearch) {
            if (searchTimeout) clearTimeout(searchTimeout);
            setSearchTimeout(setTimeout(() => {
                props.onSearch!(value);
            }, 400));
        }
    }

    return (
        <div className={"col-12 flex justify-content-between align-items-center " + props.className} style={{backgroundColor: '#F7F9FB', borderRadius: 8, padding: 8, marginBottom: 4}}>
            {(props.onAddClicked) && (
                <span className="pi pi-plus cursor-pointer" onClick={props.onAddClicked} style={{color: '#1C1C1C', paddingLeft: 8}}/>
            )}
            {(props.onSearch) && (
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search"> </InputIcon>
                    <InputText placeholder={searchPlaceHolder} onChange={(value) => setValue(value.target.value)}/>
                </IconField>
            )}
        </div>
    );

};


