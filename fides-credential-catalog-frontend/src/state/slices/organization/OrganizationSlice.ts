import { createSlice } from '@reduxjs/toolkit';
import { defaultGenericPagableState, defaultGenericState, GenericPageableState, GenericState } from '../model';
import { addGenericPageableStateListBuilders, addGenericPageableStateSingleBuilders, addGenericStateSingleBuilders } from '../slice';
import { createOrUpdateOrganization, deleteOrganization, getOrganization, getOrganizations } from './OrganizationApi';


export interface Organization {
    id: string;
    name: string;
}

export interface OrganizationState extends GenericPageableState<Organization> {
}

export const organizationSlice = createSlice({
    name: 'organization',
    initialState: defaultGenericPagableState,
    reducers: {},
    extraReducers: builder => {
        addGenericPageableStateListBuilders(builder, getOrganizations);
        addGenericPageableStateSingleBuilders(builder, getOrganization);
        addGenericPageableStateSingleBuilders(builder, createOrUpdateOrganization);
        addGenericPageableStateSingleBuilders(builder, deleteOrganization);
    },
});

