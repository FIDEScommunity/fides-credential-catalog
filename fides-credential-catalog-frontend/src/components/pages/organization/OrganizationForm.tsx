import * as React from 'react';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useKeycloak } from '@react-keycloak/web';
import { isFidesAdminSelector, useAppDispatch } from '../../../state';
import { OCard, OFabContainer, TextInputWithLabel } from '../../molecules';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ErrorAlert } from '../../molecules/ErrorAlert';
import { createOrUpdateOrganization, deleteOrganization, getOrganization, getOrganizations, Organization, organizationSelector } from '../../../state/slices/organization';
import { setToastMessage } from '../../../state/slices/toast';


export const OrganizationForm: FC = () => {
    let navigation = useNavigate();
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();
    const {organizationId} = useParams();
    const {t} = useTranslation();

    const organization = useSelector(organizationSelector);
    const isAdmin = useSelector(isFidesAdminSelector);
    const [organizationForm, setOrganizationForm] = useState<Organization>({name:''});

    useEffect(() => {
        if (isAdmin) {
            dispatch(getOrganizations({jwtToken: keycloak.token!}));
        }
    }, [keycloak.token, isAdmin]);

    useEffect(() => {
        if (organizationId) {
            dispatch(getOrganization({jwtToken: keycloak.token!, organizationId: organizationId})).then((response) => {
                if (response.type.includes('fulfilled')) {
                    setOrganizationForm(response.payload);
                }
            });
        }
    }, [keycloak.token, organizationId]);

    function handleFormUpdate(attributeName: string, value: any | undefined) {
        setOrganizationForm(Object.assign({}, organizationForm, {[attributeName]: value}));
    }

    function onSaveConfiguration() {
        dispatch(createOrUpdateOrganization({jwtToken: keycloak.token!, organization: organizationForm})).then((response) => {
            if (response.type.includes('fulfilled')) {
                dispatch(setToastMessage({message: "The organization is updated"}));
                // toastRef.current!.show({severity: 'info', summary: "organizationId and password copied to clipboard", life: 3000});
                setTimeout(() => { // Use timeout the give time to update the redux store.
                    navigation('/organization');
                }, 250);
            }
        });
    }

    function onCancel() {
        navigation('/organization');
    }

    const deleteConfirmDialog = () => {
        function handleDelete() {
            if (organizationId) {
                dispatch(deleteOrganization({jwtToken: keycloak.token!, organizationId: organizationForm.id})).then((response) => {
                    if (response.type.includes('fulfilled')) {
                        setTimeout(() => { // Use timeout the give time to update the redux store.
                            navigation('/organization');
                        }, 250);
                    }
                });
            }
        }

        confirmDialog({
            header: t('screens.organizationForm.organizationDeleteConfirmDialog.title'),
            message: t('screens.organizationForm.organizationDeleteConfirmDialog.message', {name: organizationForm.name}),
            icon: 'pi pi-question-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: handleDelete,
            reject: () => {
            }
        });
    };

    let isValid = organizationForm?.name !== undefined;

    return (
        <>
            {organizationForm && (
                <div className="mr-2">
                    <ConfirmDialog/>
                    <ErrorAlert
                        errorMessage={organization.error}
                        show={organization.error !== undefined}/>
                    <OCard className="mt-4" title={t('screens.organizationForm.title')}>
                        <TextInputWithLabel className="mb-3"
                                            label={t('screens.organizationForm.attributes.name.label')}
                                            placeHolder={t('screens.organizationForm.attributes.name.placeHolder')}
                                            value={organizationForm?.name}
                                            onChangeValue={(value) => handleFormUpdate('name', value)}/>
                    </OCard>
                    <Button label={t('generic.delete')} size="small" severity="secondary" className="w-max ml-1 mt-4" onClick={deleteConfirmDialog}/>
                    <OFabContainer className="w-full">
                        <Button label={t('generic.save')} size="small" className="w-max" onClick={onSaveConfiguration} disabled={!isValid}/>
                        <Button label={t('generic.cancel')} size="small" severity="secondary" className="w-max ml-1" onClick={onCancel}/>
                    </OFabContainer>
                </div>

            )}
        </>
    );
};
