import { createSlice } from '@reduxjs/toolkit';
import { defaultGenericPagableState, DisplayProperties, GenericPageableState } from '../model';
import { addGenericPageableStateListBuilders, addGenericPageableStateSingleBuilders } from '../slice';
import { getCredentialType, getCredentialTypes } from './CredentialTypeApi';

export interface CredentialType {
    id: string;
    issuanceUrl: string;
    description: string;
    deploymentEnvironment: string;
    visibilityStatus: string;
    supportedOpenId4VcSpecVersion: string;
    issuerDisplay: DisplayProperties;
    credentialConfigurationId: string;
    credentialKind: string;
    defaultDisplayLocale: string;
    display: DisplayProperties;
    credentialAttributes: Map<string, DisplayProperties>;
    schemaUrl: string;
    schemaInfo: string;
    trustFrameworkUrl: string;
    trustFrameworkInfo: string;
    documentationUrl: string;
    documentationInfo: string;
    issuePortalUrl: string;
    grantTypesSupported: string[]
    credentialFormat: string;
    cryptographicBindingMethodsSupported: string[];
    credentialSigningAlgValuesSupported: string[];
    locale: string[];
}


export interface CredentialTypeState extends GenericPageableState<CredentialType> {
}

export const credentialTypeSlice = createSlice({
    name: 'credentialType',
    initialState: defaultGenericPagableState,
    reducers: {},
    extraReducers: builder => {
        addGenericPageableStateListBuilders(builder, getCredentialTypes);
        addGenericPageableStateSingleBuilders(builder, getCredentialType);
    },
});

