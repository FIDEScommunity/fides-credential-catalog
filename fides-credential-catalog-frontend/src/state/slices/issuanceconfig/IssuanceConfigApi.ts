import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../global';

import { bearerAuth } from '../auth';
import axios from 'axios';
import { IssuanceConfig } from './IssuanceConfigSlice';


export const getIssuanceConfigs = createAsyncThunk(
    'issuanceConfig/getIssuanceConfigs', ({jwtToken}: { jwtToken: string | undefined }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        ;
        return axios.get('/issuanceConfig', config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const getIssuanceConfig = createAsyncThunk(
    'issuanceConfig/getIssuanceConfig', ({jwtToken, id}: { jwtToken: string | undefined, id: string }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        ;
        return axios.get('/issuanceConfig/' + id, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const updateIssuanceConfig = createAsyncThunk(
    'issuanceConfig/updateIssuanceConfig', ({jwtToken, form}: { jwtToken: string | undefined, form: IssuanceConfig}, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        const body = form;
        return axios.post('/issuanceConfig', body, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const deleteIssuanceConfig = createAsyncThunk(
    'issuanceConfig/deleteIssuanceConfig', ({jwtToken, id}: { jwtToken: string | undefined, id: string }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        return axios.delete('/issuanceConfig/' + id, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

