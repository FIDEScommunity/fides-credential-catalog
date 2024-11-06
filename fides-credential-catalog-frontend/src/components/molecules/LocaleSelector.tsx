import { FC, useMemo } from 'react';
import { FlagIcon } from '../atoms';

export interface LocaleSelectorProps {
    className?: string | undefined;
    selectedLocale?: string;
    onLocaleSelected: (language: string) => void;
    allowedLocales?: string[] | undefined;
    extraLocale?: string | undefined;
}

export const LocaleSelector: FC<LocaleSelectorProps> = (props) => {

    const selectedLocale = useMemo(() => (props.selectedLocale === undefined) ? 'en_en' : props.selectedLocale
        , [props.selectedLocale]);

    const locales = useMemo(() => {
        if ((props.extraLocale === undefined) || props.allowedLocales?.includes(props.extraLocale || '')) {
            return props.allowedLocales || [];
        } else {
            return [...(props.allowedLocales || []), props.extraLocale];
        }
    }, [props.allowedLocales, props.extraLocale]);


    return (
        <div className={props.className}>
            {locales.map(locale => (
                <div className="flex align-items-center ml-2 cursor-pointer" key={locale} onClick={event => props.onLocaleSelected(locale)}><FlagIcon locale={locale} className="mr-1"/><span
                    className={"text-xs " + (selectedLocale === locale ? "font-bold" : "")}>{locale}{locale.length > 0 && locale.length !== 5 ? ' (Invalid locale)' : ''}</span></div>
            ))}
        </div>
    )
};

