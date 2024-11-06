import { Action, combineReducers, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { globalSlice, GlobalState } from './slices';
import { userSlice, UserState } from './slices/user/UserSlice';
import { issuanceConfigSlice, IssuanceConfigState } from './slices/issuanceconfig';
import { issuanceConfigFormSlice, IssuanceConfigFormState } from './slices/issuanceconfigform';
import { credentialTypeSlice, CredentialTypeState } from './slices/credentialtype';
import { CredentialTypeSearchForm, credentialTypeSearchFormSlice } from './slices/credentialtypesearchform';
import { staticDataSlice, StaticDataState } from './slices/staticdata';
import { userPreferenceSlice, UserPreferenceState } from './slices/userpreference';
import { organizationSlice, OrganizationState } from './slices/organization';
import { userMaintenanceSlice, UserMaintenanceState } from './slices/usermaintanance';
import { toastMessageSlice, ToastMessageState } from './slices/toast/ToastMessageSlice';


export interface ApplicationState {
    globalState: GlobalState;
    userState: UserState;
    issuanceConfigState: IssuanceConfigState;
    issuanceConfigFormState: IssuanceConfigFormState;
    credentialTypeState: CredentialTypeState;
    credentialTypeSearchFormState: CredentialTypeSearchForm;
    staticDataState: StaticDataState;
    userPreferenceState: UserPreferenceState;
    organizationState: OrganizationState;
    userMaintenanceState: UserMaintenanceState;
    toastMessageState: ToastMessageState;
}

const rootReducer = combineReducers<ApplicationState>({
    globalState: globalSlice.reducer,
    userState: userSlice.reducer,
    issuanceConfigState: issuanceConfigSlice.reducer,
    issuanceConfigFormState: issuanceConfigFormSlice.reducer,
    credentialTypeState: credentialTypeSlice.reducer,
    credentialTypeSearchFormState: credentialTypeSearchFormSlice.reducer,
    staticDataState: staticDataSlice.reducer,
    userPreferenceState: userPreferenceSlice.reducer,
    organizationState: organizationSlice.reducer,
    userMaintenanceState: userMaintenanceSlice.reducer,
    toastMessageState: toastMessageSlice.reducer
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;
