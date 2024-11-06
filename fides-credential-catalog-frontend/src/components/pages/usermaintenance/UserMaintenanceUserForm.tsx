import * as React from 'react';
import { FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useKeycloak } from '@react-keycloak/web';
import { isFidesAdminSelector, useAppDispatch, userSelector } from '../../../state';
import { InputWithLabel, OCard, OFabContainer, OrganizationSelector, TextInputWithLabel, TextToHtml } from '../../molecules';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ErrorAlert } from '../../molecules/ErrorAlert';
import { getOrganizations, organizationSelector } from '../../../state/slices/organization';
import { defaultUserMaintenanceUser, deleteUserMaintenanceUser, getUserMaintenanceUser, passwordResetUserMaintenanceUser, updateUserMaintenanceUser, userMaintenanceSelector, UserMaintenanceUser } from '../../../state/slices/usermaintanance';
import { setToastMessage } from '../../../state/slices/toast';
import { isValidEmail } from '../../../utils';



export const UserMaintenanceUserForm: FC = () => {
    let navigation = useNavigate();
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();
    const {userId} = useParams();
    const {t} = useTranslation();
    const userMaintenanceUser = useSelector(userMaintenanceSelector);

    const organizations = useSelector(organizationSelector);
    const isAdmin = useSelector(isFidesAdminSelector);
    const user = useSelector(userSelector);
    const [userForm, setUserForm] = useState<UserMaintenanceUser>(defaultUserMaintenanceUser);

    useEffect(() => {
        if (isAdmin) {
            dispatch(getOrganizations({jwtToken: keycloak.token!}));
        }
    }, [keycloak.token, isAdmin]);

    useEffect(() => {
        if (userId) {
            dispatch(getUserMaintenanceUser({jwtToken: keycloak.token!, userId: userId})).then((response) => {
                if (response.type.includes('fulfilled')) {
                    setUserForm(response.payload);
                }
            });
        }
    }, [keycloak.token, userId]);

    function handleFormUpdate(attributeName: string, value: any | undefined) {
        setUserForm(Object.assign({}, userForm, {[attributeName]: value}));
    }

    function showUserCreatedDialog(userName: string, password: string) {
        confirmDialog({
            header: t('screens.userMaintenanceUserForm.userCreatedDialog.title'),
            message: (
                <div>
                    <div><TextToHtml value={t('screens.userMaintenanceUserForm.userCreatedDialog.message')}/></div>
                    <div className="bg-bluegray-50 p-4 mt-4 flex justify-content-between">
                        <div>
                            <div>{t('screens.userMaintenanceUserForm.userCreatedDialog.userId', {userName})}</div>
                            <div>{t('screens.userMaintenanceUserForm.userCreatedDialog.password', {password})}</div>
                        </div>
                        <div className="pi pi-copy cursor-pointer" onClick={event => {
                            navigator.clipboard.writeText(t('screens.userMaintenanceUserForm.userCreatedDialog.userId', {userName}) + '\n' + t('screens.userMaintenanceUserForm.userCreatedDialog.password', {password}));
                            dispatch(setToastMessage({message: "UserId and password copied to clipboard"}));
                            // if (toastRef?.current !== undefined) {
                            //     toastRef.current!.show({severity: 'info', summary: "UserId and password copied to clipboard", life: 3000});
                            // }
                        }}></div>
                    </div>
                </div>
            ),
            defaultFocus: 'accept',
            acceptClassName: 'p-button-info',
            acceptLabel: t('generic.ok'),
            accept: () => {
                navigation('/userMaintenance');
            },
            rejectClassName: 'hidden'
        });
    }

    // showUserCreatedDialog("abc", "123");

    function onSaveConfiguration() {
        dispatch(updateUserMaintenanceUser({jwtToken: keycloak.token!, userMaintenanceUser: userForm})).then((response) => {
            if (response.type.includes('fulfilled')) {
                if (response.payload.tempPassword !== undefined) { // A new user is added
                    showUserCreatedDialog(response.payload.userName, response.payload.tempPassword);
                } else {
                    dispatch(setToastMessage({message: "The user is updated"}));
                    // toastRef.current!.show({severity: 'info', summary: "UserId and password copied to clipboard", life: 3000});
                    setTimeout(() => { // Use timeout the give time to update the redux store.
                        navigation('/userMaintenance');
                    }, 250);
                }
            }
        });
    }

    function onCancel() {
        navigation('/userMaintenance');
    }

    const deleteConfirmDialog = () => {
        function handleDelete() {
            if (userId) {
                dispatch(deleteUserMaintenanceUser({jwtToken: keycloak.token!, userId: userForm.id})).then((response) => {
                    if (response.type.includes('fulfilled')) {
                        setTimeout(() => { // Use timeout the give time to update the redux store.
                            navigation('/userMaintenance');
                        }, 250);
                    }
                });
            }
        }

        confirmDialog({
            header: t('screens.userMaintenanceUserForm.userDeleteConfirmDialog.title'),
            message: t('screens.userMaintenanceUserForm.userDeleteConfirmDialog.message', {userName: userForm.userName}),
            icon: 'pi pi-question-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: handleDelete,
            reject: () => {
            }
        });
    };

    let isValid = userForm?.lastName !== undefined &&
        userForm?.firstName !== undefined &&
        userForm?.userName !== undefined &&
        isValidEmail(userForm?.userName) &&
        userForm?.lastName.indexOf("!") === -1 &&
        userForm?.firstName.indexOf("!") === -1 &&
        userForm?.userName.indexOf("!") === -1;

    function showPasswordResetCompletedDialog(userName: string, password: string) {
        confirmDialog({
            header: t('screens.userMaintenanceUserForm.passwordResetCompletedDialog.title'),
            message: <div>
                <div><TextToHtml value={t('screens.userMaintenanceUserForm.passwordResetCompletedDialog.message', {userName})}/></div>
                <div className="bg-bluegray-50 p-4 mt-4 flex justify-content-between">
                    <div>
                        <div>{t('screens.userMaintenanceUserForm.userCreatedDialog.password', {password})}</div>
                    </div>
                    <div className="pi pi-copy cursor-pointer" onClick={event => {
                        navigator.clipboard.writeText(password);
                        dispatch(setToastMessage({message: "Password copied to clipboard"}));
                    }}></div>
                </div>
            </div>,
            icon: 'pi pi-info-circle',
            defaultFocus: 'accept',
            acceptClassName: 'p-button-info',
            acceptLabel: t('generic.ok'),
            accept: () => {
            },
            rejectClassName: 'hidden'
        });
    }

    function handlePasswordReset() {
        dispatch(passwordResetUserMaintenanceUser({jwtToken: keycloak.token!, userId: userId})).then((response) => {
            if (response.type.includes('fulfilled')) {
                if (response.payload.tempPassword !== undefined) { // A new user is added
                    showPasswordResetCompletedDialog(response.payload.userName, response.payload.tempPassword);
                } else {
                    dispatch(setToastMessage({message: "The user is updated"}));
                    // toastRef.current!.show({severity: 'info', summary: "UserId and password copied to clipboard", life: 3000});
                    setTimeout(() => { // Use timeout the give time to update the redux store.
                        navigation('/userMaintenance');
                    }, 250);
                }
            }
        });
    }

    function passwordResetConfirmDialog() {
        confirmDialog({
            header: t('screens.userMaintenanceUserForm.passwordResetConfirmDialog.title'),
            message: t('screens.userMaintenanceUserForm.passwordResetConfirmDialog.message', {userName: userForm.userName}),
            icon: 'pi pi-question-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: handlePasswordReset,
            reject: () => {
            }
        });
    }

    return (
        <>
            {userForm && (
                <div className="mr-2">
                    <ConfirmDialog/>
                    <ErrorAlert
                        errorMessage={userMaintenanceUser.error}
                        show={userMaintenanceUser.error !== undefined}/>
                    <OCard className="mt-4" title={t('screens.userMaintenanceUserForm.title')}>
                        <TextInputWithLabel className="mb-3"
                                            label={t('screens.userMaintenanceUserForm.attributes.userName.label')}
                                            placeHolder={t('screens.userMaintenanceUserForm.attributes.userName.placeHolder')}
                                            value={userForm?.userName}
                                            onChangeValue={(value) => handleFormUpdate('userName', value)}/>
                        <TextInputWithLabel className="mb-3"
                                            label={t('screens.userMaintenanceUserForm.attributes.lastName.label')}
                                            placeHolder={t('screens.userMaintenanceUserForm.attributes.lastName.placeHolder')}
                                            value={userForm?.lastName}
                                            onChangeValue={(value) => handleFormUpdate('lastName', value)}/>
                        <TextInputWithLabel className="mb-3"
                                            label={t('screens.userMaintenanceUserForm.attributes.firstName.label')}
                                            placeHolder={t('screens.userMaintenanceUserForm.attributes.firstName.placeHolder')}
                                            value={userForm?.firstName}
                                            onChangeValue={(value) => handleFormUpdate('firstName', value)}/>
                        <InputWithLabel className="mb-3"
                                        label={t('screens.userMaintenanceUserForm.attributes.organization.label')}
                                        inputElement={<OrganizationSelector
                                            organizations={organizations.list}
                                            selectedOrganizationId={userForm.organization?.id}
                                            onValueSelected={(value) => handleFormUpdate('organization', value)}/>}
                        />
                    </OCard>
                    <Button label={t('generic.delete')} size="small" severity="secondary" className="w-max ml-1 mt-4" onClick={deleteConfirmDialog}/>
                    <Button label={t('screens.userMaintenanceUserForm.passwordResetButton')} size="small" severity="secondary" className="w-max ml-1 mt-4" onClick={passwordResetConfirmDialog}/>
                    <OFabContainer className="w-full">
                        <Button label={t('generic.save')} size="small" className="w-max" onClick={onSaveConfiguration} disabled={!isValid}/>
                        <Button label={t('generic.cancel')} size="small" severity="secondary" className="w-max ml-1" onClick={onCancel}/>
                    </OFabContainer>
                </div>

            )}
        </>
    );
};
