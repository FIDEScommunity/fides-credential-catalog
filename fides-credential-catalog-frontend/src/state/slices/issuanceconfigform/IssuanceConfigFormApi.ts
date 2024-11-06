import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../global';

import { bearerAuth } from '../auth';
import axios from 'axios';


export const retrieveDataForOpenIssuanceUrl = createAsyncThunk(
    'issuanceConfigForm/retrieveDataForOpenIssuanceUrl', ({jwtToken, issuanceUrl}: { jwtToken: string | undefined, issuanceUrl: string }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        const body = {issuanceUrl: issuanceUrl};
        return axios.post('/issuanceConfig/issuanceUrlData', body, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

