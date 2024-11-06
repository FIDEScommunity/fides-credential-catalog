import React from 'react';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { useAppDispatch } from '../../state';
import { useSelector } from 'react-redux';
import { updateUserPreferencePreference, UserPreferenceEntry, userPreferenceSelector } from '../../state/slices/userpreference';

interface OPaginatorProps {
    className?: string | undefined;
    first?: number | undefined;
    rows?: number | undefined;
    totalRecords?: number | undefined;
    rowsPerPageOptions?: number[] | undefined;

    onPageChange?(event: PaginatorPageChangeEvent): void;

    userPreferencesKey: string;
}

export const OPaginator: React.FC<OPaginatorProps> = (props) => {
    const dispatch = useAppDispatch();
    let userPreference = useSelector(userPreferenceSelector).singleItem;

    function onPageChange(paginatorPageChangeEvent: PaginatorPageChangeEvent) {
        if (paginatorPageChangeEvent.rows !== props.rows) {
            dispatch(updateUserPreferencePreference({
                locale: userPreference?.locale!,
                currentUserPreferences: userPreference?.userPreferences,
                userPreferenceToUpdate: {preferenceKey: props.userPreferencesKey + '.pageSize', preferenceValue: '' + paginatorPageChangeEvent.rows} as UserPreferenceEntry
            }));
        }
        props.onPageChange?.(paginatorPageChangeEvent)
    }

    return (
        <Paginator first={props.first} rows={props.rows} totalRecords={props.totalRecords} rowsPerPageOptions={[10, 20, 30]} onPageChange={onPageChange}/>
    );
};
