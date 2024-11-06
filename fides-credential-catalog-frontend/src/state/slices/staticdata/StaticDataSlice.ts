import { createSlice } from '@reduxjs/toolkit';
import { defaultGenericState, GenericState } from '../model';
import { addGenericStateSingleBuilders } from '../slice';
import { getStaticData } from './StaticDataApi';


export interface StaticData {
    grantTypesSupported: string[];
    authorization_code: string[];
    credentialFormat: string[];
    cryptographicBindingMethodsSupported: string[];
    credentialSigningAlgValuesSupported: string[];
    locale: string[];
}

export interface StaticDataState extends GenericState<StaticData> {
}

export const staticDataSlice = createSlice({
    name: 'staticdData',
    initialState: defaultGenericState,
    reducers: {},
    extraReducers: builder => {
        addGenericStateSingleBuilders(builder, getStaticData);
    },
});

