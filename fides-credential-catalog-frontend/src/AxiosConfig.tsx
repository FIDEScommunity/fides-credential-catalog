import axios, { AxiosRequestTransformer } from 'axios';
import { Store } from '@reduxjs/toolkit';
import moment from 'moment-timezone';


const dateTransformer = (data: any): any => {
    if (data instanceof Date) {
        return moment(data).format('YYYY-MM-DDTHH:mm:ss')
    }
    if (Array.isArray(data)) {
        return data.map(dateTransformer)
    }
    if (typeof data === 'object' && data !== null) {
        return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, dateTransformer(value)]))
    }
    return data
}

export function configureAxiosDefaults(store: Store) {
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.baseURL = '/api';

    axios.defaults.transformRequest = [dateTransformer, ...(axios.defaults.transformRequest as AxiosRequestTransformer[])];
    axios.interceptors.response.use(response => response, error => {
        var errorResponse = error;
        if (error.response && error.response.data) {
            errorResponse = error.response.data;
        }

        // Jwt token expired
        if (error.response.status === 419) {
            store.dispatch({
                type: 'jwtExpired'
            });
        }
        return Promise.reject(errorResponse.message);
    });

}
