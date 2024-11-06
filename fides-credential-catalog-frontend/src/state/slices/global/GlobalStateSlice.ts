import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GlobalState {
    isLoading: boolean;
}

const INITIAL_STATE: GlobalState = {
    isLoading: false
};

export const globalSlice = createSlice({
    name: 'global',
    initialState: INITIAL_STATE,
    reducers: {
        setLoading: (state: GlobalState, action: PayloadAction<boolean>) => {
            return {
                ...state,
                isLoading: action.payload
            };
        },
    }
});

export const {setLoading} = globalSlice.actions;
