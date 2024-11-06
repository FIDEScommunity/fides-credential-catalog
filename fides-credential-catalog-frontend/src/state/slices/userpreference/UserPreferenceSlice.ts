import { createSlice } from '@reduxjs/toolkit';
import { defaultGenericState, GenericState } from '../model';
import { addGenericStateSingleBuilders } from '../slice';
import { getUserPreference, updateUserPreference, updateUserPreferencePreference } from './UserPreferenceApi';


export interface UserPreference {
    locale: string;
    userPreferences: UserPreferenceEntry[];
}

export interface UserPreferenceEntry {
    preferenceKey: string;
    preferenceValue: string;

}
export interface UserPreferenceState extends GenericState<UserPreference> {
}

export const userPreferenceSlice = createSlice({
    name: 'userPreference',
    initialState: defaultGenericState,
    reducers: {},
    extraReducers: builder => {
        addGenericStateSingleBuilders(builder, getUserPreference);
        addGenericStateSingleBuilders(builder, updateUserPreference);
        addGenericStateSingleBuilders(builder, updateUserPreferencePreference);
    },
});

export const getUserPreferencePreference = (userPreference: UserPreference, preferenceKey: string): UserPreferenceEntry | undefined => {
    return userPreference.userPreferences.find(preference => preference.preferenceKey === preferenceKey);
}

export const getUserPreferenceWithDefault = (userPreference: UserPreference | undefined, preferenceKey: string, defaultValue: string): string => {
    if ((userPreference === undefined) || (userPreference?.userPreferences === undefined)) {
        return defaultValue;
    }
    const valueFound = userPreference?.userPreferences.find(preference => preference.preferenceKey === preferenceKey);
    return (valueFound === undefined) ? defaultValue : valueFound.preferenceValue;
}
