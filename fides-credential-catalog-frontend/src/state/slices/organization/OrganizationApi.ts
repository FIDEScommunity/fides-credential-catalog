import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../global';

import { bearerAuth } from '../auth';
import axios from 'axios';
import { addQueryParam } from '../slice';
import { Organization } from './OrganizationSlice';


export const getOrganizations = createAsyncThunk(
    'organization/getOrganizations', ({jwtToken}: { jwtToken: string | undefined }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };

        var url = '/organization';

        return axios.get(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const getOrganization = createAsyncThunk(
    'organization/getOrganization', ({jwtToken, organizationId}: { jwtToken: string | undefined, organizationId: string }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };

        var url = '/organization/' + organizationId;

        return axios.get(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const createOrUpdateOrganization = createAsyncThunk(
    'organization/createOrUpdateOrganization', ({jwtToken, organization}: { jwtToken: string | undefined, organization: Organization }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };

        var url = '/organization';
        const body = organization;
        return axios.post(url, body, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const deleteOrganization = createAsyncThunk(
    'organization/deleteOrganization', ({jwtToken, organizationId}: { jwtToken: string | undefined, organizationId: string }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };

        var url = '/organization/' + organizationId;

        return axios.delete(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);
