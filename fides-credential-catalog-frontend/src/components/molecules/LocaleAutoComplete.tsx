import { FC, useEffect, useState } from 'react';
import { FlagIcon } from '../atoms';
import { Locale, LOCALES } from '../../state/slices/model/Locale';
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from 'primereact/autocomplete';

export interface LocaleAutoCompleteProps {
    className?: string | undefined;
    selectedLocale?: string;
    onLocaleSelected: (locale: string) => void;
}

export const LocaleAutoComplete: FC<LocaleAutoCompleteProps> = (props) => {
    const [value, setValue] = useState<Locale[]>();
    const [items, setItems] = useState<Locale[]>([]);

    useEffect(() => {
            const loc = (props.selectedLocale === undefined) ? 'en_en' : props.selectedLocale;
            let items = LOCALES.filter(item => item.locale.toLowerCase().indexOf(loc.toLowerCase()) > -1);
            if (items.length > 0) {
                setValue(items);
            } else {
                setValue(Object.assign([], LOCALES[0]));
            }
        }
        , [props.selectedLocale]);

    const search = (event: AutoCompleteCompleteEvent) => {
        setValue(undefined)
        let newItems = event.query ? LOCALES.filter(item => (item.name.toLowerCase().indexOf(event.query.toLowerCase()) > -1) || item.locale.toLowerCase().indexOf(event.query.toLowerCase()) > -1) : LOCALES;
        setItems(Object.assign([], newItems));
    }

    const itemTemplate = (item: Locale) => {
        return (
            <div className="flex align-items-center">
                <FlagIcon locale={item.locale} className="mr-2"/>
                <div>{item.name} - {item.locale}</div>
            </div>
        );
    };
    const selectedItemTemplate = (item: Locale) => {
        return (
            <div className="flex align-items-center">
                <FlagIcon locale={item.locale} className="mr-2"/>
                <div>{item.name} - {item.locale}</div>
            </div>
        );
    };

    function selectValue(value: Locale[]) {
        if (value) {
            props.onLocaleSelected(value[0].locale);
        }
        setValue(value)
    }

    return (
        <div className={props.className}>
            <AutoComplete className="localeSelector"
                          value={value}
                          suggestions={items}
                          completeMethod={search}
                          onChange={(e: AutoCompleteChangeEvent) => selectValue(e.value)}
                          multiple
                          forceSelection
                          dropdown itemTemplate={itemTemplate}
                          selectedItemTemplate={selectedItemTemplate}/>
        </div>
    )
};

