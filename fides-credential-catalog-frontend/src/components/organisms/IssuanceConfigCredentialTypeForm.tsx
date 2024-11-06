import React, { FC } from "react";
import { IssuanceConfig, IssuanceConfigCredentialType } from '../../state/slices/issuanceconfig';
import { CredentialTypeCard, InputWithLabel, TextInputWithLabel } from '../molecules';
import { useTranslation } from 'react-i18next';
import { CredentialKindSelector } from '../molecules/CredentialKindSelector';


interface IssuanceConfigCredentialTypeFormProps {
    issuanceConfig: IssuanceConfig;
    issuanceConfigCredentialType: IssuanceConfigCredentialType
    onChangeValue: (issuanceConfigCredentialType: IssuanceConfigCredentialType, attributeName: string, value: any) => void;
}

export const IssuanceConfigCredentialTypeForm: FC<IssuanceConfigCredentialTypeFormProps> = (props) => {
    const {t} = useTranslation();

    return (
        <div className="grid">
            <div className="col-2">
                <CredentialTypeCard credentialType={props.issuanceConfigCredentialType}
                                    credentialTypeDisplay={props.issuanceConfigCredentialType.display}
                                    issuerDisplay={props.issuanceConfig.issuerDisplay}
                                    />
            </div>
            <div className="col-10">
                {/*<div className="grid">*/}
                <InputWithLabel className="mb-3 align-items-center"
                                label={t('fields.issuanceConfigCredentialType.credentialKind.typeDescription')+ '*'}
                                inputElement={<CredentialKindSelector
                                    selectedValue={props.issuanceConfigCredentialType.credentialKind}
                                    onValueSelected={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'credentialKind', value)}/>}
                />
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.defaultDisplayLocale.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.defaultDisplayLocale.placeHolder')}
                                    value={props.issuanceConfigCredentialType.defaultDisplayLocale}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'defaultDisplayLocale', value)}/>
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.issuePortalUrl.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.issuePortalUrl.placeHolder')}
                                    value={props.issuanceConfigCredentialType.issuePortalUrl}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'issuePortalUrl', value)}/>
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.schemaUrl.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.schemaUrl.placeHolder')}
                                    value={props.issuanceConfigCredentialType.schemaUrl}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'schemaUrl', value)}/>
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.schemaInfo.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.schemaInfo.placeHolder')}
                                    value={props.issuanceConfigCredentialType.schemaInfo}
                                    multiline={true}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'schemaInfo', value)}/>
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.documentationUrl.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.documentationUrl.placeHolder')}
                                    value={props.issuanceConfigCredentialType.documentationUrl}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'documentationUrl', value)}/>
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.documentationInfo.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.documentationInfo.placeHolder')}
                                    value={props.issuanceConfigCredentialType.documentationInfo}
                                    multiline={true}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'documentationInfo', value)}/>
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.trustFrameworkUrl.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.trustFrameworkUrl.placeHolder')}
                                    value={props.issuanceConfigCredentialType.trustFrameworkUrl}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'trustFrameworkUrl', value)}/>
                <TextInputWithLabel className="mb-3 align-items-center"
                                    label={t('fields.issuanceConfigCredentialType.trustFrameworkInfo.typeDescription')}
                                    placeHolder={t('fields.issuanceConfigCredentialType.trustFrameworkInfo.placeHolder')}
                                    value={props.issuanceConfigCredentialType.trustFrameworkInfo}
                                    multiline={true}
                                    onChangeValue={(value) => props.onChangeValue(props.issuanceConfigCredentialType, 'trustFrameworkInfo', value)}/>

            </div>
        </div>
    );
};
