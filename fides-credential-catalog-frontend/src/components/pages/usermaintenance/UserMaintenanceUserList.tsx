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
import { useKeycloak } from '@react-keycloak/web';
import { isFidesAdminSelector, useAppDispatch } from '../../../state';
import { Button } from 'primereact/button';
import { getUserPreferenceWithDefault, userPreferenceSelector } from '../../../state/slices/userpreference';
import { ErrorAlert } from '../../molecules/ErrorAlert';
import { getUserMaintenanceUsers, userMaintenanceSelector } from '../../../state/slices/usermaintanance';


export const UserMaintenanceUserList: FC = () => {
    let navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();
    const {t} = useTranslation();
    const userPreference = useSelector(userPreferenceSelector).singleItem;
    const isAdmin = useSelector(isFidesAdminSelector);
    const userMaintenanceState = useSelector(userMaintenanceSelector);

    const initialParams: DataViewPageEvent = {
        first: 0,
        rows: Number(getUserPreferenceWithDefault(userPreference, 'userMaintenanceUserList.pageSize', "30")),
        page: 0,
        pageCount: 1
    };

    const [tableParams, setTableParams] = useState<DataViewPageEvent>(initialParams);

    useEffect(() => {
        dispatch(getUserMaintenanceUsers({
            jwtToken: keycloak.token!,
            page: tableParams.page,
            pageSize: (tableParams.rows),
        }));
    }, [keycloak.token, tableParams.page, tableParams.rows]);


    function onPageChange(paginatorPageChangeEvent: PaginatorPageChangeEvent) {
        setTableParams({...tableParams, page: paginatorPageChangeEvent.page, rows: paginatorPageChangeEvent.rows});
    }

    function onRowSelect(event: DataTableSelectEvent) {
        navigate('/userMaintenance/edit/' + event.data.id);
    }

    function createNew() {
        navigate('/userMaintenance/new');
    }

        return (
        <>
            <div>
                <ErrorAlert
                    className="mb-4"
                    errorMessage={userMaintenanceState.error}
                    show={userMaintenanceState.error !== undefined}/>

                <DataTable value={userMaintenanceState.list}
                           rows={10}
                           rowsPerPageOptions={[10, 20, 30]}
                           tableStyle={{minWidth: '50rem'}}
                           selectionMode="single"
                           onRowSelect={onRowSelect}
                           rowHover={true}
                >
                    <Column field="userName" header={t('fields.userMaintenance.userName.typeDescription')}></Column>
                    <Column field="lastName" header={t('fields.userMaintenance.lastName.typeDescription')}></Column>
                    <Column field="firstName" header={t('fields.userMaintenance.firstName.typeDescription')}></Column>
                    <Column field="organization.name" header={t('fields.organization.name.typeDescription')}></Column>
                </DataTable>
                {((userMaintenanceState.list.length > 0) && (userMaintenanceState.totalPages > 1)) && (
                    <div className="flex justify-content-end">
                        <OPaginator first={userMaintenanceState.currentPage * tableParams.rows} rows={tableParams.rows} totalRecords={userMaintenanceState.totalElements} rowsPerPageOptions={[10, 20, 30]} onPageChange={onPageChange}
                                    userPreferencesKey={"userMaintenanceUserList"}/>
                    </div>
                )}
                <div className="grid mt-4 ml-2">
                    <Button label={t('generic.add')} size="small" className="w-max" onClick={createNew}/>
                </div>
            </div>
        </>
    );
}
