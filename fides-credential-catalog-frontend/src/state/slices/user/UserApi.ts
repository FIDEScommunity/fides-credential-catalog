import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../global';
import axios from 'axios';
import { bearerAuth } from '../auth';


export const getUser = createAsyncThunk(
    'user/getUser', ({jwtToken}: { jwtToken: string | undefined }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        ;
        return axios.get('/user', config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);



