import { defaultGenericState, GenericState } from './GenericState';

export interface GenericPageableState<T> extends GenericState<T> {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
    isLastPage: boolean;
}

export const defaultGenericPagableState: GenericPageableState<any> = {
    ...defaultGenericState,
    currentPage: 0,
    pageSize: 0,
    totalPages: 0,
    totalElements: 0,
    isLastPage: false
}
