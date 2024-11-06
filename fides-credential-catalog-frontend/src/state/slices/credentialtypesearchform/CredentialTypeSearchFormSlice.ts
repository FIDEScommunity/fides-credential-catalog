import { createSlice } from '@reduxjs/toolkit';
import { DeploymentEnvironment } from '../model/DeploymentEnvironment';
import { CredentialKind } from '../model';


export interface CredentialTypeSearchForm {
    searchText: string;
    deploymentEnvironment: DeploymentEnvironment[];
    credentialKind: CredentialKind[];
    grantTypesSupported: string[]
    credentialFormat: string[]
    cryptographicBindingMethodsSupported: string[]
    credentialSigningAlgValuesSupported: string[]
    locale: string[]
}

export interface CredentialTypeSearchFormState extends CredentialTypeSearchForm {
}

export const CredentialTypeSearchFormInitialState: CredentialTypeSearchForm = {
    searchText: '',
    deploymentEnvironment: [],
    credentialKind: [],
    grantTypesSupported: [],
    credentialFormat: [],
    cryptographicBindingMethodsSupported: [],
    credentialSigningAlgValuesSupported: [],
    locale: []
};


export const credentialTypeSearchFormSlice = createSlice({
    name: 'credentialTypeSearchForm',
    initialState: CredentialTypeSearchFormInitialState,
    reducers: {
        setCredentialTypeSearchForm(state: any, action) {
            return Object.assign(state, action.payload);
        }

    },
});

export const {setCredentialTypeSearchForm} = credentialTypeSearchFormSlice.actions
