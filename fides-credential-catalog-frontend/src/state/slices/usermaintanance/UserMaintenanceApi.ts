import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../global';

import { bearerAuth } from '../auth';
import axios from 'axios';
import { addQueryParam } from '../slice';
import { UserMaintenanceUser } from './UserMaintenanceSlice';


export const getUserMaintenanceUsers = createAsyncThunk(
    'userMaintenance/getUsers', ({jwtToken, page, pageSize}: {
        jwtToken: string | undefined,
        page: number,
        pageSize: number
    }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };

        var url = '/usermaintenance/user';
        url = addQueryParam(url, 'page', page);
        url = addQueryParam(url, 'size', pageSize);

        return axios.get(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const getUserMaintenanceUser = createAsyncThunk(
    'userMaintenance/getUser', ({jwtToken, userId}: { jwtToken: string | undefined, userId: string}, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        var url = '/usermaintenance/user/' + userId ;

        return axios.get(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const updateUserMaintenanceUser = createAsyncThunk(
    'userMaintenance/getUser', ({jwtToken, userMaintenanceUser}: { jwtToken: string | undefined, userMaintenanceUser?: UserMaintenanceUser}, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        var url = '/usermaintenance/user';
        const body = userMaintenanceUser;

        return axios.post(url, body, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const passwordResetUserMaintenanceUser = createAsyncThunk(
    'userMaintenance/passwordReswet', ({jwtToken, userId}: { jwtToken: string | undefined, userId?: string}, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        var url = '/usermaintenance/user/' + userId + '/passwordreset';

        return axios.post(url, {}, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const deleteUserMaintenanceUser = createAsyncThunk(
    'userMaintenance/deleteUser', ({jwtToken, userId}: { jwtToken: string | undefined, userId?: string}, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));

        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        var url = '/usermaintenance/user/' + userId;

        return axios.delete(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

