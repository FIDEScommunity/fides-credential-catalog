import { createSlice } from '@reduxjs/toolkit';
import { DeploymentEnvironment } from '../model/DeploymentEnvironment';
import { CredentialKind } from '../model';


export interface ToastMessage {
    message: string | undefined;
}

export interface ToastMessageState extends ToastMessage {
}

export const ToastMessageInitialState: ToastMessage = {
    message: undefined
};


export const toastMessageSlice = createSlice({
    name: 'toastMessage',
    initialState: ToastMessageInitialState,
    reducers: {
        setToastMessage(state: any, action) {
            return Object.assign(state, action.payload);
        }

    },
});

export const {setToastMessage} = toastMessageSlice.actions
