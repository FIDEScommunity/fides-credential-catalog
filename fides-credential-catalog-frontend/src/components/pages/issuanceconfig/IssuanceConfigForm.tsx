import * as React from 'react';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteIssuanceConfig, getIssuanceConfig, IssuanceConfigCredentialType, issuanceConfigSelector, updateIssuanceConfig } from '../../../state/slices/issuanceconfig';
import { useKeycloak } from '@react-keycloak/web';
import { isFidesAdminSelector, useAppDispatch, userSelector } from '../../../state';
import { InputWithLabel, OCard, OFabContainer, OpenId4VcSpecVersionSelector, OrganizationSelector, RichTextEditorWithLabel, TextInputWithLabel, TextToHtml } from '../../molecules';
import { Button } from 'primereact/button';
import { VisibilityStatusSelector } from '../../molecules/VisibilityStatusSelector';
import { DeploymentEnvironmentSelector } from '../../molecules/DeploymentEnvironmentSelector';
import { IssuanceConfigFormInitialState, issuanceConfigFormSelector, retrieveDataForOpenIssuanceUrl, setIssuanceConfigForm } from '../../../state/slices/issuanceconfigform';
import { isValidUrl } from '../../../utils';
import { IssuanceConfigCredentialTypeForm } from '../../organisms';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ErrorAlert } from '../../molecules/ErrorAlert';
import { getOrganizations, organizationSelector } from '../../../state/slices/organization';


export const IssuanceConfigForm: FC = () => {
    let navigation = useNavigate();
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();
    const {issuanceConfigId} = useParams();
    const {t} = useTranslation();
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();


    const issuanceConfigForm = useSelector(issuanceConfigFormSelector);
    const issuanceConfig = useSelector(issuanceConfigSelector);
    const organizations = useSelector(organizationSelector);
    const isAdmin = useSelector(isFidesAdminSelector);
    const user = useSelector(userSelector);

    useEffect(() => {
        dispatch(setIssuanceConfigForm(IssuanceConfigFormInitialState.form))
        if (issuanceConfigId !== undefined) {
            dispatch(getIssuanceConfig({jwtToken: keycloak.token!, id: issuanceConfigId})).then((response) => {
                if (response.type.includes('fulfilled')) {
                    dispatch(setIssuanceConfigForm(response.payload));
                }
            });
        }
    }, [keycloak.token, issuanceConfigId]);

    useEffect(() => {
        if ((issuanceConfigForm.form.issuanceUrl !== undefined) && (issuanceConfigForm.form.issuanceUrl.trim().length > 7) && (isValidUrl(issuanceConfigForm.form.issuanceUrl))) {
            if (searchTimeout) clearTimeout(searchTimeout);
            setSearchTimeout(setTimeout(() => {
                dispatch(retrieveDataForOpenIssuanceUrl({jwtToken: keycloak.token!, issuanceUrl: issuanceConfigForm.form.issuanceUrl}));
            }, 1000));
        }
    }, [keycloak.token, issuanceConfigForm.form.issuanceUrl]);

    useEffect(() => {
        if (isAdmin) {
            dispatch(getOrganizations({jwtToken: keycloak.token!}));
        }
    }, [keycloak.token, isAdmin]);


    function handleFormUpdate(attributeName: string, value: any | undefined) {
        dispatch(setIssuanceConfigForm(Object.assign({}, issuanceConfigForm.form, {[attributeName]: value})));
    }

    function handleCredentialTypeFormUpdate(issuanceConfigCredentialType: IssuanceConfigCredentialType, attributeName: string, value: any | undefined) {
        let indexToUpdate = issuanceConfigForm.form.credentialTypes.findIndex(item => item.credentialConfigurationId === issuanceConfigCredentialType.credentialConfigurationId);
        let newObj = Object.assign({}, issuanceConfigCredentialType, {[attributeName]: value});
        const newArray = Object.assign([] as IssuanceConfigCredentialType[], issuanceConfigForm.form.credentialTypes);
        newArray[indexToUpdate] = newObj;
        handleFormUpdate('credentialTypes', newArray);
    }

    function onSaveConfiguration() {
        dispatch(updateIssuanceConfig({jwtToken: keycloak.token!, form: issuanceConfigForm.form})).then((response) => {
            if (response.type.includes('fulfilled')) {
                setTimeout(() => { // Use timeout the give time to update the redux store.
                    navigation('/issuanceConfig');
                }, 250);
            }
        });
    }

    function onCancel() {
        navigation('/issuanceConfig');
    }

        const deleteConfirmDialog = () => {
            function handleDelete() {
                if (issuanceConfigId) {
                    dispatch(deleteIssuanceConfig({jwtToken: keycloak.token!, id: issuanceConfigId})).then((response) => {
                        if (response.type.includes('fulfilled')) {
                            setTimeout(() => { // Use timeout the give time to update the redux store.
                                navigation('/issuanceConfig');
                            }, 250);
                        }
                    });
                }
            }

            confirmDialog({
                header: t('screens.issuanceConfigForm.deleteConfirmTitle'),
                message: t('screens.issuanceConfigForm.deleteConfirmMessage'),
                icon: 'pi pi-question-circle',
                defaultFocus: 'reject',
                acceptClassName: 'p-button-danger',
                accept: handleDelete,
                reject: () => {
                }
            });
        };

    return (
        <>
            {issuanceConfigForm.form && (
                <div className="mr-2">
                    <ConfirmDialog/>
                    <ErrorAlert
                        errorMessage={issuanceConfigForm.error}
                        show={issuanceConfigForm.error !== undefined}/>
                    <ErrorAlert
                        errorMessage={issuanceConfig.error}
                        show={issuanceConfig.error !== undefined}/>
                    <OCard className="mt-4" title={t('screens.issuanceConfigForm.title')}>
                        {(isAdmin) && (
                            <InputWithLabel className="mb-3"
                                            label={t('screens.issuanceConfigForm.attributes.organization.label')}
                                            inputElement={<OrganizationSelector
                                                organizations={organizations.list}
                                                selectedOrganizationId={issuanceConfigForm.form.organization?.id}
                                                defaultOrganizationId={user.singleItem?.organization.id}
                                                onValueSelected={(value) => handleFormUpdate('organization', value)}/>}
                            />
                        )}
                        <TextInputWithLabel className="mb-3"
                                            label={t('screens.issuanceConfigForm.attributes.name.label')}
                                            placeHolder={t('screens.issuanceConfigForm.attributes.name.placeHolder')}
                                            value={issuanceConfigForm.form?.name}
                                            onChangeValue={(value) => handleFormUpdate('name', value)}/>
                        <RichTextEditorWithLabel className="mb-3"
                                                 label={t('fields.issuanceConfig.description.typeDescription')}
                                                 placeHolder={t('screens.issuanceConfigForm.attributes.description.placeHolder')}
                                                 value={issuanceConfigForm.form?.description}
                                                 onChangeValue={(value) => handleFormUpdate('description', value)}/>
                        <div className="mb-6"><TextToHtml value={issuanceConfigForm.form?.description} addNonVisibleHtmlBreaks={false}/></div>
                        <TextInputWithLabel className="mb-3"
                                            label={t('fields.issuanceConfig.issuanceUrl.typeDescription')}
                                            placeHolder={t('screens.issuanceConfigForm.attributes.issuanceUrl.placeHolder')}
                                            value={issuanceConfigForm.form?.issuanceUrl}
                                            onChangeValue={(value) => handleFormUpdate('issuanceUrl', value)}/>
                        <InputWithLabel className="mb-3"
                                        label={t('fields.issuanceConfig.deploymentEnvironment.typeDescription')}
                                        inputElement={<DeploymentEnvironmentSelector
                                            selectedValue={issuanceConfigForm.form.deploymentEnvironment}
                                            onValueSelected={(value) => handleFormUpdate('deploymentEnvironment', value)}/>}
                        />
                        <InputWithLabel className="mb-3"
                                        label={t('fields.issuanceConfig.visibilityStatus.typeDescription')}
                                        inputElement={<VisibilityStatusSelector
                                            selectedValue={issuanceConfigForm.form.visibilityStatus}
                                            onValueSelected={(value) => handleFormUpdate('visibilityStatus', value)}/>}
                        />
                        <InputWithLabel className="mb-3"
                                        label={t('screens.issuanceConfigForm.attributes.supportedOpenId4VcSpecVersion.label')}
                                        inputElement={<OpenId4VcSpecVersionSelector
                                            selectedValue={issuanceConfigForm.form.supportedOpenId4VcSpecVersion}
                                            onValueSelected={(value) => handleFormUpdate('supportedOpenId4VcSpecVersion', value)}/>}
                        />
                    </OCard>
                    <Accordion multiple activeIndex={[0, 1, 2, 3]} className="mt-4">
                        {issuanceConfigForm.form.credentialTypes?.map((issuanceConfigCredentialType, index) => (
                            <AccordionTab
                                key={index}
                                contentClassName="mb-4"
                                header={(issuanceConfigCredentialType.display.name !== undefined ? issuanceConfigCredentialType.display.name : issuanceConfigCredentialType.credentialConfigurationId)}>
                                <IssuanceConfigCredentialTypeForm key={index} issuanceConfig={issuanceConfigForm.form} issuanceConfigCredentialType={issuanceConfigCredentialType} onChangeValue={handleCredentialTypeFormUpdate}/>
                            </AccordionTab>
                        ))}
                    </Accordion>
                    <Button label={t('screens.issuanceConfigForm.delete')} size="small" severity="secondary" className="w-max ml-1 mb-8" onClick={deleteConfirmDialog}/>
                    <OFabContainer className="w-full">
                        <Button label={t('screens.issuanceConfigForm.save')} size="small" className="w-max" onClick={onSaveConfiguration} disabled={!issuanceConfigForm.isValid}/>
                        <Button label={t('generic.cancel')} size="small" severity="secondary" className="w-max ml-1" onClick={onCancel}/>
                    </OFabContainer>
                </div>

            )}
        </>
    );
};
