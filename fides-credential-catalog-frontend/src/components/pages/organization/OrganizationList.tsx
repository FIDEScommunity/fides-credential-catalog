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
import { getOrganizations, organizationSelector } from '../../../state/slices/organization';


export const OrganizationList: FC = () => {
    let navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();
    const {t} = useTranslation();
    const userPreference = useSelector(userPreferenceSelector).singleItem;
    const isAdmin = useSelector(isFidesAdminSelector);
    const organizationState = useSelector(organizationSelector);

    const initialParams: DataViewPageEvent = {
        first: 0,
        rows: Number(getUserPreferenceWithDefault(userPreference, 'organizationList.pageSize', "30")),
        page: 0,
        pageCount: 1
    };

    const [tableParams, setTableParams] = useState<DataViewPageEvent>(initialParams);

    useEffect(() => {
        dispatch(getOrganizations({
            jwtToken: keycloak.token!,
            page: tableParams.page,
            pageSize: (tableParams.rows),
        }));
    }, [keycloak.token, tableParams.page, tableParams.rows]);


    function onPageChange(paginatorPageChangeEvent: PaginatorPageChangeEvent) {
        setTableParams({...tableParams, page: paginatorPageChangeEvent.page, rows: paginatorPageChangeEvent.rows});
    }

    function onRowSelect(event: DataTableSelectEvent) {
        navigate('/organization/edit/' + event.data.id);
    }

    function createNew() {
        navigate('/organization/new');
    }

        return (
        <>
            <div>
                <ErrorAlert
                    className="mb-4"
                    errorMessage={organizationState.error}
                    show={organizationState.error !== undefined}/>

                <DataTable value={organizationState.list}
                           rows={10}
                           rowsPerPageOptions={[10, 20, 30]}
                           tableStyle={{minWidth: '50rem'}}
                           selectionMode="single"
                           onRowSelect={onRowSelect}
                           rowHover={true}
                >
                    <Column field="name" header={t('fields.organization.name.typeDescription')}></Column>
                </DataTable>
                {((organizationState.list.length > 0) && (organizationState.totalPages > 1)) && (
                    <div className="flex justify-content-end">
                        <OPaginator first={organizationState.currentPage * tableParams.rows} rows={tableParams.rows} totalRecords={organizationState.totalElements} rowsPerPageOptions={[10, 20, 30]} onPageChange={onPageChange}
                                    userPreferencesKey={"organizationList"}/>
                    </div>
                )}
                <div className="grid mt-4 ml-2">
                    <Button label={t('generic.add')} size="small" className="w-max" onClick={createNew}/>
                </div>
            </div>
        </>
    );
}
