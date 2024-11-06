import * as React from 'react';
import { FC, useEffect, useMemo, useRef } from 'react';
import { credentialTypeSelector, getCredentialType } from '../../../state/slices/credentialtype';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../../../state';
import { useKeycloak } from '@react-keycloak/web';
import { updateUserPreference, userPreferenceSelector } from '../../../state/slices/userpreference';
import { CredentialKindText, CredentialTypeCard, LocaleSelector, LocalesView, OCard, TextToHtml, TextWithExternalLink, TextWithLabel } from '../../molecules';
import { OpenId4VcSpecVersionTextWithLink } from '../../molecules/OpenId4VcSpecVersionTextWithLink';
import { PanelMenu } from 'primereact/panelmenu';
import { MenuItem } from 'primereact/menuitem';
import { ErrorAlert } from '../../molecules/ErrorAlert';


export const CredentialTypeDetail: FC = () => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();

    let credentialType = useSelector(credentialTypeSelector);
    let userPreference = useSelector(userPreferenceSelector).singleItem;

    const mobileIssuanceConfigRef = useRef<any | HTMLDivElement>(null);
    const mobileCredentialTypeRef = useRef<any | HTMLDivElement>(null);
    const mobileCredentialTypeAttributesRef = useRef<any | HTMLDivElement>(null);
    const mobileAdditionalInformationRef = useRef<any | HTMLDivElement>(null);
    const issuanceConfigRef = useRef<any | HTMLDivElement>(null);
    const credentialTypeRef = useRef<any | HTMLDivElement>(null);
    const credentialTypeAttributesRef = useRef<any | HTMLDivElement>(null);
    const additionalInformationRef = useRef<any | HTMLDivElement>(null);

    const {credentialTypeId} = useParams();

    useEffect(() => {
        if (credentialTypeId !== undefined) {
            dispatch(getCredentialType({jwtToken: keycloak.token!, credentialTypeId: credentialTypeId, locale: userPreference?.locale}));
        }
    }, [keycloak.token, credentialTypeId, userPreference?.locale]);


    function getMenuItems(
        pAdditionalInformationRef: React.MutableRefObject<any>,
        pIssuanceConfigRef: React.MutableRefObject<any>,
        pCredentialTypeRef: React.MutableRefObject<any>,
        pCredentialTypeAttributesRef: React.MutableRefObject<any>,
                          ): MenuItem[] {
        return [
            {
                label: t('screens.credentialTypeDetail.additionalInformation.title'),
                className: 'mt-2',
                command: () => {
                    pAdditionalInformationRef.current?.scrollIntoView({behavior: "smooth"});
                }
            },
            {
                label: 'OID4VCI Meta Data',
                expanded: true,
                items: [
                    {
                        label: t('screens.credentialTypeDetail.issuanceConfig.title'),
                        command: () => {
                            pIssuanceConfigRef.current?.scrollIntoView({behavior: "smooth"});
                        }
                    },
                    {
                        label: t('screens.credentialTypeDetail.credentialTypeConfig.title'),
                        command: () => {
                            pCredentialTypeRef.current?.scrollIntoView({behavior: "smooth"});
                        }
                    },
                    {
                        label: t('screens.credentialTypeDetail.credentialTypeAttributes.title'),
                        command: () => {
                            pCredentialTypeAttributesRef.current?.scrollIntoView({behavior: "smooth"});
                        }
                    }
                ]
            }
        ];
    }

    const mobileMenuItems = useMemo(() => {
        return getMenuItems(mobileAdditionalInformationRef, mobileIssuanceConfigRef, mobileCredentialTypeRef, mobileCredentialTypeAttributesRef);
    }, []);
    const menuItems = useMemo(() => {
        return getMenuItems(additionalInformationRef, issuanceConfigRef, credentialTypeRef, credentialTypeAttributesRef);
    }, []);


    function createAdditionalInformation(ref: React.MutableRefObject<any>) {
        return <div ref={ref}>
            <OCard className="mt-4 bg-white" title={t('screens.credentialTypeDetail.additionalInformation.title')}>
                {(credentialType.singleItem?.description) && (
                    <div className="mb-6"><TextToHtml value={credentialType.singleItem?.description} addNonVisibleHtmlBreaks={false}/></div>
                )}
                <TextWithLabel className="mb-3"
                               label={t('fields.issuanceConfig.deploymentEnvironment.typeDescription')}
                               value={t('fields.issuanceConfig.deploymentEnvironment.values.' + credentialType.singleItem?.deploymentEnvironment)}/>
                {credentialType.singleItem?.visibilityStatus === 'PRIVATE' && (
                    <TextWithLabel className="mb-3"
                                   label={t('fields.issuanceConfig.visibilityStatus.typeDescription')}
                                   value={t('fields.issuanceConfig.visibilityStatus.values.' + credentialType.singleItem?.visibilityStatus)}/>
                )}
                <TextWithLabel className="mb-3"
                               label={t('fields.issuanceConfigCredentialType.credentialKind.typeDescription')}
                               value={<CredentialKindText credentialKind={credentialType.singleItem?.credentialKind}/>}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.issuePortalUrl.typeDescription')}
                               value={<TextWithExternalLink link={credentialType.singleItem?.issuePortalUrl}/>}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.defaultDisplayLocale.typeDescription')}
                               value={<LocalesView locales={credentialType.singleItem?.defaultDisplayLocale}/>}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.schemaUrl.typeDescription')}
                               value={<TextWithExternalLink link={credentialType.singleItem?.schemaUrl}/>}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.schemaInfo.typeDescription')}
                               value={credentialType.singleItem?.schemaInfo}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.documentationUrl.typeDescription')}
                               value={<TextWithExternalLink link={credentialType.singleItem?.documentationUrl}/>}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.documentationInfo.typeDescription')}
                               value={credentialType.singleItem?.documentationInfo}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.trustFrameworkUrl.typeDescription')}
                               value={<TextWithExternalLink link={credentialType.singleItem?.trustFrameworkUrl}/>}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.trustFrameworkInfo.typeDescription')}
                               value={credentialType.singleItem?.trustFrameworkInfo}/>
            </OCard>
        </div>;
    }

    function createIssuanceConfig(ref: React.MutableRefObject<any>) {
        return <div ref={ref}>
            <OCard className="mt-4" title={t('screens.credentialTypeDetail.issuanceConfig.title')}>
                <TextWithLabel className="mb-3"
                               label={t('fields.issuanceConfig.issuerName.typeDescription')}
                               value={credentialType.singleItem?.issuerDisplay?.name}/>
                <TextWithLabel className="mb-3"
                               label={t('fields.issuanceConfig.issuanceUrl.typeDescription')}
                               value={<TextWithExternalLink link={credentialType.singleItem?.issuanceUrl}/>}/>
                <TextWithLabel className="mb-3"
                               label={t('fields.issuanceConfig.openId4VcSpecVersion.typeDescription')}
                               value={(
                                   <OpenId4VcSpecVersionTextWithLink supportedOpenId4VcSpecVersion={credentialType.singleItem?.supportedOpenId4VcSpecVersion}/>
                               )}/>
                <TextWithLabel className="mb-3"
                               label={t('fields.issuanceConfig.grantTypesSupported.typeDescription')}
                               value={credentialType.singleItem?.grantTypesSupported?.join(", ")}/>
            </OCard>
        </div>;
    }

    function createCredentialType(ref: React.MutableRefObject<any>) {
        return <div ref={ref}>
            <OCard className="mt-4" title={t('screens.credentialTypeDetail.credentialTypeConfig.title')}>
                <TextWithLabel className="mb-3"
                               label={t('fields.issuanceConfigCredentialType.credentialConfigurationId.typeDescription')}
                               value={credentialType.singleItem?.credentialConfigurationId}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.locale.typeDescription')}
                               value={<LocalesView locales={credentialType.singleItem?.locale}/>}/>

                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.cryptographicBindingMethodsSupported.typeDescription')}
                               value={credentialType.singleItem?.cryptographicBindingMethodsSupported?.join(", ")}/>
                <TextWithLabel className="mb-3 align-items-center"
                               label={t('fields.issuanceConfigCredentialType.credentialSigningAlgValuesSupported.typeDescription')}
                               value={credentialType.singleItem?.credentialSigningAlgValuesSupported?.join(", ")}/>
            </OCard>
        </div>;
    }

    function createCredentialTypeAttributes(ref: React.MutableRefObject<any>) {
        return <div ref={ref}>
            <OCard className="mt-4 mb-4" title={t('screens.credentialTypeDetail.credentialTypeAttributes.title')}>
                {(
                    (credentialType.singleItem !== undefined) &&
                    (credentialType.singleItem?.credentialAttributes !== undefined) &&
                    <TextWithLabel className="mb-3 align-items-center"
                                   classNameLabel="col-12 md:col-6 font-semibold"
                                   classNameValue="col-12 md:col-6 font-semibold"
                                   label={t('screens.credentialTypeDetail.attributeName.label')}
                                   value={t('screens.credentialTypeDetail.translation.label')}/>
                )}
                {(
                    (credentialType.singleItem !== undefined) &&
                    (credentialType.singleItem?.credentialAttributes !== undefined) &&
                    (Object.keys(credentialType.singleItem?.credentialAttributes).map((key, index) => (
                            <TextWithLabel className="mb-3 align-items-center"
                                           classNameLabel="col-12 md:col-6"
                                           classNameValue="col-12 md:col-6"
                                           key={key}
                                           label={<TextToHtml value={key}/>}
                                           value={<TextToHtml value={Object.values(credentialType.singleItem?.credentialAttributes!)[index]?.name}/>}/>
                        ))
                    )
                )}
            </OCard>
        </div>;
    }

    function createMenu(pMenuItems: MenuItem[] | undefined) {
        return <>
            <CredentialTypeCard
                credentialType={credentialType}
                credentialTypeDisplay={credentialType.singleItem?.display!} key='{index}'
                issuerDisplay={credentialType.singleItem?.issuerDisplay!}
            />
            <LocaleSelector className="flex justify-content-start"
                            allowedLocales={credentialType.singleItem?.locale}
                            extraLocale={credentialType.singleItem?.defaultDisplayLocale}
                            selectedLocale={userPreference?.locale}
                            onLocaleSelected={(locale) => {
                                if (locale.length == 5) {
                                    dispatch(updateUserPreference({locale: locale, userPreferences: userPreference?.userPreferences}));
                                }
                            }}
            />
            <PanelMenu className="mt-4" model={pMenuItems} multiple={true} style={{}}/>
        </>;
    }

    return (
        <>
            <div className="hidden md-display-grid grid mb-8" style={{
            gridTemplateColumns: '20% 80%',
            maxWidth: '100em',
                margin: '0 auto'
            }}>
                <div className="mr-3"
                     style={{
                         position: 'sticky',
                         top: '2rem',
                         alignSelf: 'start'
                     }}>

                    {createMenu(menuItems)}

                </div>
                <div className="grid-nogutter" style={{marginTop: '-20px'}}>
                    <ErrorAlert
                        className="mb-4"
                        errorMessage={credentialType.error}
                        show={credentialType.error !== undefined}/>

                    {createAdditionalInformation(additionalInformationRef)}
                    {createIssuanceConfig(issuanceConfigRef)}
                    {createCredentialType(credentialTypeRef)}
                    {createCredentialTypeAttributes(credentialTypeAttributesRef)}
                </div>
            </div>
            <div className="md:hidden grid mb-8">
                <div className="">
                    <ErrorAlert
                        className="mb-4"
                        errorMessage={credentialType.error}
                        show={credentialType.error !== undefined}/>
                    {createMenu(mobileMenuItems)}
                    {createAdditionalInformation(mobileAdditionalInformationRef)}
                    {createIssuanceConfig(mobileIssuanceConfigRef)}
                    {createCredentialType(mobileCredentialTypeRef)}
                    {createCredentialTypeAttributes(mobileCredentialTypeAttributesRef)}
                </div>
            </div>
        </>
    )
        ;
}
