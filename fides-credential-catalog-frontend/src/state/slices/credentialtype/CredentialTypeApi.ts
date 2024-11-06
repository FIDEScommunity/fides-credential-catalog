import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../global';

import { bearerAuth } from '../auth';
import axios from 'axios';
import { addQueryParam } from '../slice';
import { CredentialTypeSearchForm } from '../credentialtypesearchform';


export const getCredentialTypes = createAsyncThunk(
    'credentialType/getCredentialTypes', ({jwtToken, page, pageSize, locale, credentialTypeSearchForm}: {
        jwtToken: string | undefined,
        page: number,
        pageSize: number,
        locale: string | undefined,
        credentialTypeSearchForm?: CredentialTypeSearchForm
    }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };

        var url = '/webpublic/credentialType';
        url = addQueryParam(url, 'page', page);
        url = addQueryParam(url, 'size', pageSize);
        url = addQueryParam(url, 'locale', locale);
        url = addQueryParam(url, 'q', credentialTypeSearchForm?.searchText);
        url = addQueryParam(url, 'deploymentEnvironment', credentialTypeSearchForm?.deploymentEnvironment);
        url = addQueryParam(url, 'credentialKind', credentialTypeSearchForm?.credentialKind);
        url = addQueryParam(url, 'grantTypesSupported', credentialTypeSearchForm?.grantTypesSupported);
        url = addQueryParam(url, 'credentialFormat', credentialTypeSearchForm?.credentialFormat);
        url = addQueryParam(url, 'cryptographicBindingMethodsSupported', credentialTypeSearchForm?.cryptographicBindingMethodsSupported);
        url = addQueryParam(url, 'credentialSigningAlgValuesSupported', credentialTypeSearchForm?.credentialSigningAlgValuesSupported);
        url = addQueryParam(url, 'localeSupported', credentialTypeSearchForm?.locale);

        return axios.get(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

export const getCredentialType = createAsyncThunk(
    'credentialType/getCredentialType', ({jwtToken, credentialTypeId, locale}: { jwtToken: string | undefined, credentialTypeId: string, locale: string | undefined, }, thunkAPI) => {
        thunkAPI.dispatch(setLoading(true));
        const config = (jwtToken === undefined) ? {} : {
            headers: {'Authorization': bearerAuth(jwtToken)}
        };
        var url = '/webpublic/credentialType/' + credentialTypeId;
        url = addQueryParam(url, 'locale', locale);

        return axios.get(url, config)
            .then(response => {
                return response.data
            })
            .finally(() => {
                thunkAPI.dispatch(setLoading(false));
            });
    },
);

