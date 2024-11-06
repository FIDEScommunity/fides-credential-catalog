import * as React from 'react';
import { FC, useEffect, useState } from 'react';

import { DataViewPageEvent } from 'primereact/dataview';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PaginatorPageChangeEvent } from 'primereact/paginator';
import { DataTable, DataTableSelectEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTranslation } from 'react-i18next';
import { InfoCard, OPaginator } from '../../molecules';
import { Pencil } from '../../atoms';
import { getIssuanceConfigs, IssuanceConfig, issuanceConfigSelector } from '../../../state/slices/issuanceconfig';
import { useKeycloak } from '@react-keycloak/web';
import { isFidesAdminSelector, useAppDispatch, userSelector } from '../../../state';
import { Button } from 'primereact/button';
import { getUserPreferenceWithDefault, userPreferenceSelector } from '../../../state/slices/userpreference';
import { ErrorAlert } from '../../molecules/ErrorAlert';


export const IssuanceConfigList: FC = () => {
    let navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();
    const {t} = useTranslation();
    const userPreference = useSelector(userPreferenceSelector).singleItem;
    const isAdmin = useSelector(isFidesAdminSelector);
    const issuanceConfigs = useSelector(issuanceConfigSelector);

    const initialParams: DataViewPageEvent = {
        first: 0,
        rows: Number(getUserPreferenceWithDefault(userPreference, 'issuanceConfigList.pageSize', "30")),
        page: 0,
        pageCount: 1
    };

    const [tableParams, setTableParams] = useState<DataViewPageEvent>(initialParams);

    useEffect(() => {
        dispatch(getIssuanceConfigs({jwtToken: keycloak.token!}));
    }, [keycloak.token]);


    function onPageChange(paginatorPageChangeEvent: PaginatorPageChangeEvent) {
        setTableParams({...tableParams, page: paginatorPageChangeEvent.page, rows: paginatorPageChangeEvent.rows});
    }

    function onRowSelect(event: DataTableSelectEvent) {
        navigate('/issuanceConfig/edit/' + event.data.id);
    }

    function createNew() {
        navigate('/issuanceConfig/new');
    }

    function showDeploymentEnvironment(issuanceConfig: IssuanceConfig) {
        return (
            t('fields.issuanceConfig.deploymentEnvironment.values.' + issuanceConfig.deploymentEnvironment)
        );
    }

    function showVisibilityStatus(issuanceConfig: IssuanceConfig) {
        return (
            t('fields.issuanceConfig.visibilityStatus.values.' + issuanceConfig.visibilityStatus)
        );
    }
    return (
        <>
            <div>
                <ErrorAlert
                    className="mb-4"
                    errorMessage={issuanceConfigs.error}
                    show={issuanceConfigs.error !== undefined}/>
                <InfoCard className="mb-4" icon={<Pencil height="30" width="30"/>}
                          title={t('screens.issuanceConfigList.intro.title')}
                          description={t('screens.issuanceConfigList.intro.description')}/>

                <DataTable value={issuanceConfigs.list}
                           rows={10}
                           rowsPerPageOptions={[10, 20, 30]}
                           tableStyle={{minWidth: '50rem'}}
                           selectionMode="single"
                           onRowSelect={onRowSelect}
                           rowHover={true}
                           >
                    <Column field="name" header={t('fields.issuanceConfig.name.typeDescription')}></Column>
                    <Column field="issuanceUrl" header={t('fields.issuanceConfig.issuanceUrl.typeDescription')}></Column>
                    <Column body={showDeploymentEnvironment} header={t('fields.issuanceConfig.deploymentEnvironment.typeDescription')}></Column>
                    <Column body={showVisibilityStatus} header={t('fields.issuanceConfig.visibilityStatus.typeDescription')}></Column>
                    {isAdmin && (
                        <Column field="organization.name" header={t('fields.organization.name.typeDescription')}></Column>
                    )}
                </DataTable>
                {((issuanceConfigs.list.length > 0) && (issuanceConfigs.totalPages > 1)) && (
                    <div className="flex justify-content-end">
                        <OPaginator first={issuanceConfigs.currentPage * tableParams.rows} rows={tableParams.rows} totalRecords={issuanceConfigs.totalElements} rowsPerPageOptions={[10, 20, 30]} onPageChange={onPageChange} userPreferencesKey={"issuanceConfigList"}/>
                    </div>
                )}
                <div className="grid mt-4 ml-2">
                    <Button label={t('screens.issuanceConfigList.add')} size="small" className="w-max" onClick={createNew}/>
                </div>
            </div>
        </>
    );
}
