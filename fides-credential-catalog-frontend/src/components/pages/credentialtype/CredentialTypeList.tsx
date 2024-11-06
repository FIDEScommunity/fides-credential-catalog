import * as React from 'react';
import { FC, useEffect, useState } from 'react';
import { CredentialType, credentialTypeSelector, getCredentialTypes } from '../../../state/slices/credentialtype';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../state';
import { useKeycloak } from '@react-keycloak/web';
import { useSelector } from 'react-redux';
import { DataViewPageEvent } from 'primereact/dataview';
import { PaginatorPageChangeEvent } from 'primereact/paginator';
import { CredentialKindText, DeploymentEnvironmentText, HelpView, LocaleAutoComplete, OPaginator, ReadMorePanel } from '../../molecules';
import { CredentialTypeSearchEntry } from '../../organisms';
import { CredentialTypeSearchForm } from '../../../state/slices/credentialtypesearchform';
import { getStaticData } from '../../../state/slices/staticdata';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getUserPreferenceWithDefault, updateUserPreference, userPreferenceSelector } from '../../../state/slices/userpreference';
import { ErrorAlert } from '../../molecules/ErrorAlert';


export const CredentialTypeList: FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const {t} = useTranslation();
    const {keycloak} = useKeycloak();
    const [searchForm, setSearchForm] = useState<CredentialTypeSearchForm>();
    let userPreference = useSelector(userPreferenceSelector).singleItem;

    const initialParams: DataViewPageEvent = {
        first: 0,
        rows: Number(getUserPreferenceWithDefault(userPreference, 'credentialTypeList.pageSize', "30")),
        page: 0,
        pageCount: 1
    };
    const [tableParams, setTableParams] = useState<DataViewPageEvent>(initialParams);

    let credentialTypes = useSelector(credentialTypeSelector);

    useEffect(() => {
        dispatch(getStaticData({}));
    }, []);

    useEffect(() => {
        dispatch(getCredentialTypes({
            jwtToken: keycloak.token!,
            locale: userPreference?.locale,
            page: tableParams.page,
            pageSize: (tableParams.rows),
            credentialTypeSearchForm: searchForm
        }));
    }, [keycloak.token, userPreference?.locale, tableParams.page, tableParams.rows, searchForm]);


    useEffect(() => {
        setTableParams({...tableParams, pageCount: credentialTypes.totalPages});
    }, [credentialTypes.totalPages]);

    function onSearch(form: CredentialTypeSearchForm | undefined) {
        setSearchForm(Object.assign({}, form));
        setTableParams({...tableParams, page: 0});
    }

    function onPageChange(paginatorPageChangeEvent: PaginatorPageChangeEvent) {
        setTableParams({...tableParams, page: paginatorPageChangeEvent.page, rows: paginatorPageChangeEvent.rows});
    }

    function onCredentialClicked(credentialType: CredentialType) {
        navigate('/credentialType/' + credentialType.id);
    }

    const logoTemplate = (credentialType: CredentialType) => {
        if (credentialType.display?.logo?.uri) {
            return (
                <img src={credentialType.display?.logo?.uri} alt={credentialType.display?.logo?.altText}
                     onError={({ currentTarget }) => {
                         currentTarget.onerror = null; // prevents looping
                         currentTarget.src='/no_image_available.jpeg';
                     }}
                     style={{
                    maxHeight: '30px',
                    maxWidth: '70px',
                    height: 'auto',
                    width: 'auto'
                }}/>
            )
        } else if (credentialType.issuerDisplay?.logo?.uri) {
            return (
                <img src={credentialType.issuerDisplay?.logo?.uri}
                     onError={({ currentTarget }) => {
                         currentTarget.onerror = null; // prevents looping
                         currentTarget.src='/no_image_available.jpeg';
                     }}
                     alt={credentialType.issuerDisplay?.logo?.altText} style={{
                    maxHeight: '30px',
                    maxWidth: '70px',
                    height: 'auto',
                    width: 'auto'
                }}/>
            )
        } else {
            return null;
        }
    };

    function getReadMorePanel() {
        return <ReadMorePanel className="" classNameBody2="mt-0" bodyPart1={(
            <span>{t('screens.credentialTypeList.body1')}</span>
        )} bodyPart2={(
            <span>{t('screens.credentialTypeList.body2')}</span>
        )}
        />;
    }

    function getLocaleSelector() {
        return <div className="flex justify-content-end mb-1">
            <LocaleAutoComplete
                className="flex justify-content-end mb-1"
                selectedLocale={userPreference?.locale} onLocaleSelected={(locale) => {
                dispatch(updateUserPreference({locale: locale, userPreferences: userPreference?.userPreferences}));
            }}
            />
            <HelpView panelClassName="w-3" helpText={t('screens.credentialTypeList.languageSelectorHelpText')}/>
        </div>;
    }

    function getDataTable() {
        return <>
            <DataTable value={credentialTypes.list} selectionMode="single" onSelectionChange={(e) => {
                onCredentialClicked(e.value);
            }}>
                <Column headerClassName="hidden md-table-cell" className="hidden md-table-cell" header="" body={logoTemplate}></Column>
                <Column header={t('fields.issuanceConfig.issuerName.typeDescription')} body={(credentialType: CredentialType) => credentialType.issuerDisplay?.name}></Column>
                <Column headerClassName="hidden lg-table-cell" className="hidden lg-table-cell" header={t('fields.issuanceConfig.deploymentEnvironment.typeDescription')}
                        body={(credentialType: CredentialType) => <DeploymentEnvironmentText deploymentEnvironment={credentialType.deploymentEnvironment}></DeploymentEnvironmentText>}></Column>
                <Column header={t('fields.issuanceConfigCredentialType.credentialType.typeDescription')} body={(credentialType: CredentialType) => credentialType.display?.name}></Column>
                <Column headerClassName="hidden lg-table-cell" className="hidden lg-table-cell" header={t('fields.issuanceConfigCredentialType.credentialFormat.typeDescription')}
                        body={(credentialType: CredentialType) => credentialType.credentialFormat}></Column>
                <Column headerClassName="hidden md-table-cell" className="hidden md-table-cell" header={t('fields.issuanceConfigCredentialType.credentialKind.typeDescription')}
                        body={(credentialType: CredentialType) => <CredentialKindText credentialKind={credentialType.credentialKind}></CredentialKindText>}></Column>
            </DataTable>

            {((credentialTypes.list.length > 0) && (credentialTypes.totalPages > 1)) && (
                <div className="flex justify-content-end">
                    <OPaginator first={credentialTypes.currentPage * tableParams.rows} rows={tableParams.rows} totalRecords={credentialTypes.totalElements} onPageChange={onPageChange} userPreferencesKey={"credentialTypeList"}/>
                </div>
            )}
        </>;
    }


    function getSearchFilter() {
        return <CredentialTypeSearchEntry title={t('screens.credentialTypeList.title')}
                                          placeHolder={t('screens.credentialTypeList.freeSearchPlaceholder')}
                                          onSearch={onSearch} className="mt-5 mb-4"/>;
    }

    return (
        <>
            <div className="hidden md:flex grid mb-6">
                <div className="md:col-3 lg:col-2">
                    {getSearchFilter()}
                </div>
                <div className="md:col-9 lg:col-10">
                    <ErrorAlert
                        className="mb-4"
                        errorMessage={credentialTypes.error}
                        show={credentialTypes.error !== undefined}/>
                    <div className="mt-4 mb-6">
                        {getReadMorePanel()}
                    </div>
                    {getLocaleSelector()}
                    {getDataTable()}
                </div>
            </div>
            <div className="md:hidden grid mb-6">
                <div className="col-12">
                    <ErrorAlert
                        className="mb-4"
                        errorMessage={credentialTypes.error}
                        show={credentialTypes.error !== undefined}/>
                    {getReadMorePanel()}
                </div>
                <div className="col-12">
                    {getSearchFilter()}
                </div>
                <div className="col-12">
                    {getLocaleSelector()}
                </div>
                <div className="col-12">
                    {getDataTable()}
                </div>
            </div>
        </>
    );
}
