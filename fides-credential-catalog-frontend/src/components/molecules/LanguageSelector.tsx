import { FC, useMemo } from 'react';
import { Dropdown, DropdownChangeEvent, DropdownProps } from 'primereact/dropdown';
import './LanguageSelector.css';
import { Language, languages, webUiLanguages } from '../../state';
import { FlagIcon } from '../atoms';

export interface LanguageSelectorProps {
    className?: string | undefined;
    selectedLocale?: string;
    onLocaleSelected: (language: string) => void;
    allowedLocales?: string[];
}

export const LanguageSelector: FC<LanguageSelectorProps> = (props) => {

    const selectedLocale = useMemo(() => (props.selectedLocale === undefined) ? 'en' : props.selectedLocale
        , [props.selectedLocale]);

    const selectedLanguageOption = useMemo(() => {
        return languages.find(language => language.locale.startsWith(selectedLocale));
    }, [selectedLocale]);
    const allowedLanguages = useMemo(() => {
        const locales = (props.allowedLocales === undefined) ? webUiLanguages : props.allowedLocales;
        return languages.filter(language => locales.includes(language.locale));
    }, [props.allowedLocales]);

    const selectedLanguageTemplate = (option: Language, props: DropdownProps) => {
        if (option) {
            return (
                <div className="flex align-items-center">
                    <FlagIcon locale={option.locale} className="mr-0"/>
                </div>
            );
        }

        return <span>{props.placeholder}</span>;
    };

    const languageOptionTemplate = (option: Language) => {
        return (
            <div className="flex align-items-center">
                <FlagIcon locale={option.locale} className="mr-2"/>
                <div>{option.name}</div>
            </div>
        );
    };

    return (
        <div className="flex justify-content-center">
            <Dropdown value={selectedLanguageOption} onChange={(e: DropdownChangeEvent) => props.onLocaleSelected(e.value.locale)} options={allowedLanguages} optionLabel="name" placeholder={props.selectedLocale}
                      valueTemplate={selectedLanguageTemplate}
                      itemTemplate={languageOptionTemplate}
                      className="border-0"
                        style={{backgroundColor: 'transparent', border: 'none'}}
                      dropdownIcon={(opts) => {
                          // @ts-ignore
                          return <></>//opts.iconProps['data-pr-overlay-visible'] ? <ChevronRightIcon color="#1C1C1C66"/> : <ChevronDownIcon color="#1C1C1C66"/>;
                      }}/>
        </div>
    )
};

