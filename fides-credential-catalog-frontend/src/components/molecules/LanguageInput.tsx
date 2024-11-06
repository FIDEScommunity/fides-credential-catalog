import React, { PropsWithChildren, useMemo } from 'react';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Language, languages } from '../../state';
import './LanguageInput.css';
import { Chip } from 'primereact/chip';
import { FlagIcon } from '../atoms';

interface LanguageInputProps {
    className?: string | undefined;
    selectedLocales?: string[];
    onLocalesSelected?: (language: string[]) => void;
    placeHolder?: string;
}


export const LanguageInput: React.FC<LanguageInputProps & PropsWithChildren> = (props) => {

    const itemTemplate = (option: any) => {
        return (
            <div className={"flex align-items-center"}>
                <FlagIcon locale={option.locale} className="mr-2"/>
                <div>{option.fullName}</div>
            </div>
        );
    };
    const valueTemplate = (option: any) => {
        if (option === undefined) {
            return null;
        }
        return (
            <Chip template={item =>
                <div className="flex align-items-center p-2">
                    <FlagIcon locale={option.locale} className="mr-2"/>
                    <div>{option.name}</div>
                </div>
            }/>
        );
    };

    const selectedLanguages = useMemo(() => {
        if (props.selectedLocales !== undefined && props.selectedLocales.length > 0) {
            return Object.assign([], (languages.filter(language => (props.selectedLocales!.indexOf(language.locale) >= 0))));
        }
        return [];
    }, [props.selectedLocales]);

    function setSelectedLanguages(selectedLanguages: Language[]) {
        if ((props.onLocalesSelected !== undefined)) {
            props.onLocalesSelected(selectedLanguages.map((language) => language.locale));
        }
    }

    return (
        <MultiSelect value={selectedLanguages} onChange={(e: MultiSelectChangeEvent) => setSelectedLanguages(e.value)} options={languages} display="chip" optionLabel="name"
                     itemTemplate={itemTemplate}
                     selectedItemTemplate={valueTemplate}
                     itemClassName="language-input-item"
                     selectAll={false}
                     placeholder={props.placeHolder}
                     className={props.className}
                     style={{border: 'none'}}
        />
    );
}
