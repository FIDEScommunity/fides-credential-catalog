import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../global';
import axios from 'axios';


export const getStaticData = createAsyncThunk(
    'staticData/getStaticData', ({locale}: { locale?: string | undefined }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        return axios.get('/webpublic/staticdata')
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

