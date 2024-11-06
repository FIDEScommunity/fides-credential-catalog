import React from 'react';
import { CredentialKind } from '../../state';
import { useTranslation } from 'react-i18next';

interface CredentialKindTextProps {
    credentialKind?: CredentialKind | string | undefined;
}

export const CredentialKindText: React.FC<CredentialKindTextProps> = (props) => {
    const {t} = useTranslation();
    if (!props.credentialKind) {
        return null;
    }
    return (<span>{t('fields.issuanceConfigCredentialType.credentialKind.values.' + props.credentialKind)}</span>);
};


