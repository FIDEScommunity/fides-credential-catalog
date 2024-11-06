import React, { useState } from 'react';
import { TextInput } from './TextInput';
import { useTranslation } from 'react-i18next';
import { OCard } from './OCard';


export interface SearchEntryProps {
    title: string;
    onSearch: (value: string | undefined) => void;
    placeHolder?: string;
    className?: string;
}

export const SearchEntry: React.FC<SearchEntryProps> = (props) => {
    const [searchValue, setSearchValue] = useState<string>();
    const {t} = useTranslation();
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();

    function setValue(value: string | undefined) {
        setSearchValue(value);
        if (props.onSearch) {
            if (searchTimeout) clearTimeout(searchTimeout);
            setSearchTimeout(setTimeout(() => {
                props.onSearch(value);
            }, 400));
        }
    }

    return (
        <OCard className={props.className}>
            <div className="font-semibold pb-4">{props.title}</div>
            <TextInput className="w-full" value={searchValue} onChangeValue={(value) => setValue(value)} placeHolder={(props.placeHolder === undefined) ? t('generic.startSearching') : props.placeHolder}/>
        </OCard>
    );
};

