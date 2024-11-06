import { createSlice } from '@reduxjs/toolkit';
import { DeploymentEnvironment } from '../model/DeploymentEnvironment';
import { VisibilityStatus } from '../model/VisibilityStatus';
import { OpenId4VcSpecVersion } from '../model/OpenId4VcSpecVersion';
import { IssuanceConfig, IssuanceConfigCredentialType } from '../issuanceconfig';
import { retrieveDataForOpenIssuanceUrl } from './IssuanceConfigFormApi';
import { getErrorCodeFromMessage, getErrorMessageFromMessage } from '../slice';
import { CredentialKind } from '../model';


export interface IssuanceConfigForm {
    loadExecuted: boolean;
    loading: boolean;
    error: string | undefined;
    errorCode: string | undefined;
    form: IssuanceConfig;
    isValid: boolean;
}

export interface IssuanceConfigFormState extends IssuanceConfigForm {
}

export const IssuanceConfigFormInitialState: IssuanceConfigForm = {
    loadExecuted: false,
    loading: false,
    error: undefined,
    errorCode: undefined,
    form: {
        name: '',
        issuanceUrl: '',
        description: '',
        deploymentEnvironment: DeploymentEnvironment.SANDBOX,
        visibilityStatus: VisibilityStatus.PRIVATE,
        supportedOpenId4VcSpecVersion: OpenId4VcSpecVersion.DRAFT13
    },
    isValid: false
} as IssuanceConfigForm;


function isFormValid(issuanceConfig: IssuanceConfig) {
    if (issuanceConfig.issuanceUrl === undefined || issuanceConfig.issuanceUrl.trim().length === 0) {

        return false;
    }
    if (issuanceConfig.credentialTypes === undefined || issuanceConfig.credentialTypes.length === 0) {
        return false;
    }
    if (issuanceConfig.credentialTypes.findIndex(value => value.credentialKind === undefined || value.credentialKind.trim().length === 0) > -1){
        return false;
    };
    return true;
}

export const issuanceConfigFormSlice = createSlice({
    name: 'issuanceConfigForm',
    initialState: IssuanceConfigFormInitialState,
    reducers: {
        setIssuanceConfigForm(state: any, action) {
            return {
                ...state,
                form: Object.assign({}, action.payload),
                isValid: isFormValid(action.payload)
            };
        }

    },
    extraReducers: (builder) => {
        builder
            .addCase(retrieveDataForOpenIssuanceUrl.pending, (state, action) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(retrieveDataForOpenIssuanceUrl.fulfilled, (state, action) => {
                state.loadExecuted = true;
                state.loading = false;
                state.error = undefined;

                if (state.form.issuanceUrl === action.payload.issuanceUrl) { // Only update the display properties if the issuanceUrl is the same. Might be an 'old' response.
                    // Update the display properties of the credential types
                    if (state.form.credentialTypes === undefined) {
                        state.form.credentialTypes = [];
                    }
                    let newCredentialTypes = action.payload.credentialTypes.map((item: IssuanceConfigCredentialType) => {
                        let index = state.form.credentialTypes.findIndex(oldItem => oldItem.credentialConfigurationId === item.credentialConfigurationId);
                        const newCredentialType = (index >= 0) ? state.form.credentialTypes[index] : item;
                        newCredentialType.display = item.display;
                        if (newCredentialType.credentialKind === undefined) {
                            newCredentialType.credentialKind = CredentialKind.UNKNOWN;
                        }
                        return newCredentialType;
                    });
                    state.form = Object.assign({}, state.form, {'issuerDisplay': action.payload.issuerDisplay, 'credentialTypes': newCredentialTypes});
                    state.isValid = isFormValid(state.form);
                }
            })
            .addCase(retrieveDataForOpenIssuanceUrl.rejected, (state, action) => {
                state.loadExecuted = true;
                state.loading = false;
                state.error = getErrorMessageFromMessage(action.error.message);
                state.errorCode = getErrorCodeFromMessage(action.error.message);
            })
    },
});

export const {setIssuanceConfigForm} = issuanceConfigFormSlice.actions
