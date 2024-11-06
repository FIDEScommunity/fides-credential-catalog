// Selectors


import { RootState } from '../../store';

export const userSelector = (state: RootState) => state.userState
export const isFidesAdminSelector = (state: RootState) => state.userState.singleItem?.roles.includes('FIDES_ADMIN');
