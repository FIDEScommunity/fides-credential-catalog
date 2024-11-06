import { createAsyncThunk } from '@reduxjs/toolkit';
import { UserPreferenceEntry } from './UserPreferenceSlice';


export const getUserPreference = createAsyncThunk(
    'userPreference/getUserPreference', () => {
        let userData = localStorage.getItem("userPreferenceData");
        return Promise.resolve(JSON.parse(userData || '{}'));
    },
);

export const updateUserPreference = createAsyncThunk(
    'userPreference/updateUserPreference', ({locale, userPreferences = []}: { locale: string, userPreferences: UserPreferenceEntry[] | undefined }, thunkAPI) => {
        const body = {
            locale: locale,
            userPreferences: userPreferences
        };
        localStorage.setItem("userPreferenceData", JSON.stringify(body));
        return Promise.resolve(body);
    },
);

export const updateUserPreferencePreference = createAsyncThunk(
    'userPreference/updateUserPreferencePreference', ({locale, currentUserPreferences, userPreferenceToUpdate}: {
        locale: string,
        currentUserPreferences: UserPreferenceEntry[] | undefined,
        userPreferenceToUpdate: UserPreferenceEntry
    }, thunkAPI) => {
        const newPrefs: UserPreferenceEntry[] = Object.assign([], currentUserPreferences);
        const index = newPrefs.findIndex(preference => preference.preferenceKey === userPreferenceToUpdate.preferenceKey);
        if (index >= 0) {
            newPrefs[index] = userPreferenceToUpdate
        } else {
            newPrefs.push({preferenceKey: userPreferenceToUpdate.preferenceKey, preferenceValue: userPreferenceToUpdate.preferenceValue});
        }

        const body = {
            locale: locale,
            userPreferences: newPrefs
        };

        localStorage.setItem("userPreferenceData", JSON.stringify(body));
        return Promise.resolve(body);
    },
);


