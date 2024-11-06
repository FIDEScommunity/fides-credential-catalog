import { FC } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import './LanguageSelector.css';
import { CredentialKind } from '../../state/slices/model/CredentialKind';
import { useTranslation } from 'react-i18next';

export interface CredentialKindSelectorProps {
    className?: string | undefined;
    selectedValue?: CredentialKind;
    onValueSelected: (CredentialKind: CredentialKind) => void;
}

export const CredentialKindSelector: FC<CredentialKindSelectorProps> = (props) => {
    const {t} = useTranslation();

    const itemTemplate = (option: CredentialKind) => {
        return (
            <div className="flex align-items-center">
                <div>{option == null ? t('fields.issuanceConfigCredentialType.credentialKind.placeHolder') : t('fields.issuanceConfigCredentialType.credentialKind.values.' + option)}</div>
            </div>
        );
    };

    return (
        <div className="">
            <Dropdown className="pr-2" value={props.selectedValue} onChange={(e: DropdownChangeEvent) => props.onValueSelected(e.value)} options={Object.values(CredentialKind)}
                      itemTemplate={itemTemplate} valueTemplate={itemTemplate}
                      placeholder={t('fields.issuanceConfigCredentialType.credentialKind.placeHolder')}
            />
        </div>
    )
};

