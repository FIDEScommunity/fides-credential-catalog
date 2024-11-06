import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TextWithExternalLink } from './TextWithExternalLink';

interface OpenId4VcSpecVersionTextWithLinkProps {
    supportedOpenId4VcSpecVersion: string | undefined;
}

export const OpenId4VcSpecVersionTextWithLink: React.FC<OpenId4VcSpecVersionTextWithLinkProps> = (props) => {
    const {t} = useTranslation();

    const {label, link} = useMemo(() => {
        switch (props.supportedOpenId4VcSpecVersion) {
            case 'DRAFT13':
                return {
                    label: t('fields.issuanceConfig.openId4VcSpecVersion.values.' + props.supportedOpenId4VcSpecVersion),
                    link: 'https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0-13.html'
                };
            default:
                return {
                    label: props.supportedOpenId4VcSpecVersion,
                    link: 'https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html'
                }
        }
    }, [props.supportedOpenId4VcSpecVersion, t]);

    if (!props.supportedOpenId4VcSpecVersion) {
        return null;
    }

    return (<TextWithExternalLink label={label} link={link}/>);
};


