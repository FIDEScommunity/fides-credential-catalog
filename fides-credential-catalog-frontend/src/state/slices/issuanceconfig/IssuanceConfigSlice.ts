import { createSlice } from '@reduxjs/toolkit';
import { CredentialKind, defaultGenericPagableState, DisplayProperties, GenericPageableState } from '../model';
import { addGenericPageableStateListBuilders, addGenericStateSingleBuilders } from '../slice';
import { deleteIssuanceConfig, getIssuanceConfig, getIssuanceConfigs, updateIssuanceConfig } from './IssuanceConfigApi';
import { DeploymentEnvironment } from '../model/DeploymentEnvironment';
import { VisibilityStatus } from '../model/VisibilityStatus';
import { OpenId4VcSpecVersion } from '../model/OpenId4VcSpecVersion';
import { Organization } from '../organization';


export interface IssuanceConfig {
    id: string;
    name: string;
    issuanceUrl: string;
    description: string;
    deploymentEnvironment: DeploymentEnvironment;
    visibilityStatus: VisibilityStatus;
    supportedOpenId4VcSpecVersion: OpenId4VcSpecVersion;
    credentialTypes: IssuanceConfigCredentialType[];
    issuerDisplay: DisplayProperties;
    organization: Organization;
}

export interface IssuanceConfigCredentialType {
    id: string;
    credentialConfigurationId: string;
    credentialKind: CredentialKind;
    defaultDisplayLocale: string;
    schemaUrl: string;
    schemaInfo: string;
    trustFrameworkUrl: string;
    trustFrameworkInfo: string;
    documentationUrl: string;
    documentationInfo: string;
    issuePortalUrl: string;
    display: DisplayProperties;
}

export interface IssuanceConfigState extends GenericPageableState<IssuanceConfig> {
}

export const issuanceConfigSlice = createSlice({
    name: 'issuanceConfig',
    initialState: defaultGenericPagableState,
    reducers: {},
    extraReducers: builder => {
        addGenericPageableStateListBuilders(builder, getIssuanceConfigs);
        addGenericStateSingleBuilders(builder, getIssuanceConfig);
        addGenericStateSingleBuilders(builder, updateIssuanceConfig);
        addGenericStateSingleBuilders(builder, deleteIssuanceConfig);
    },
});

