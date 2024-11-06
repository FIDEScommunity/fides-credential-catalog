import { createSlice } from '@reduxjs/toolkit';
import { defaultGenericState, GenericState } from '../model';
import { addGenericStateSingleBuilders } from '../slice';
import { getUser } from './UserApi';
import { Organization } from '../organization';


export interface User {
    name: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    organization: Organization;
    roles: string[];
}

export interface UserState extends GenericState<User> {
}

export const userSlice = createSlice({
    name: 'user',
    initialState: defaultGenericState,
    reducers: {},
    extraReducers: builder => {
        addGenericStateSingleBuilders(builder, getUser);
    },
});
