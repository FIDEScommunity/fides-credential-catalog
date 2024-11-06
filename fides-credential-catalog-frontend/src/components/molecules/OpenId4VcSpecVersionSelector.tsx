import { FC } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import './LanguageSelector.css';
import { OpenId4VcSpecVersion } from '../../state/slices/model/OpenId4VcSpecVersion';
import { useTranslation } from 'react-i18next';

export interface OpenId4VcSpecVersionSelectorProps {
    className?: string | undefined;
    selectedValue?: OpenId4VcSpecVersion;
    onValueSelected: (OpenId4VcSpecVersion: OpenId4VcSpecVersion) => void;
}

export const OpenId4VcSpecVersionSelector: FC<OpenId4VcSpecVersionSelectorProps> = (props) => {
        const {t} = useTranslation();

        const itemTemplate = (option: OpenId4VcSpecVersion) => {
            return (
                <div className="flex align-items-center">
                    <div>{t('fields.issuanceConfig.openId4VcSpecVersion.values.' + option)}</div>
                </div>
            );
        };

        return (
            <div className="">
                <Dropdown className="pr-2" value={props.selectedValue} onChange={(e: DropdownChangeEvent) => props.onValueSelected(e.value)} options={Object.values(OpenId4VcSpecVersion)}
                          itemTemplate={itemTemplate} valueTemplate={itemTemplate}
                />
            </div>
        )
    }
;

