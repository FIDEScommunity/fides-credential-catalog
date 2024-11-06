import { createSlice } from '@reduxjs/toolkit';
import { defaultGenericPagableState, GenericPageableState } from '../model';
import { addGenericPageableStateListBuilders, addGenericPageableStateSingleBuilders } from '../slice';
import { deleteUserMaintenanceUser, getUserMaintenanceUser, getUserMaintenanceUsers, passwordResetUserMaintenanceUser } from './UserMaintenanceApi';
import { Organization } from '../organization';

export interface UserMaintenanceUser {
    id: string | undefined;
    userName: string;
    name: string;
    firstName: string;
    lastName: string;
    organization: Organization;
}

export const defaultUserMaintenanceUser: UserMaintenanceUser = {
    id: undefined,
    userName: '',
    name: '',
    firstName: '',
    lastName: '',
    organization: {} as Organization
}

export interface UserMaintenanceState extends GenericPageableState<UserMaintenanceUser> {
}

export const userMaintenanceSlice = createSlice({
    name: 'userMaintenance',
    initialState: defaultGenericPagableState,
    reducers: {},
    extraReducers: builder => {
        addGenericPageableStateListBuilders(builder, getUserMaintenanceUsers);
        addGenericPageableStateSingleBuilders(builder, getUserMaintenanceUser);
        addGenericPageableStateSingleBuilders(builder, passwordResetUserMaintenanceUser);
        addGenericPageableStateSingleBuilders(builder, deleteUserMaintenanceUser);
    },
});

