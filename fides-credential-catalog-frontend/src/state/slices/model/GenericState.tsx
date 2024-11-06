export interface GenericState<T> {
    loadExecuted: boolean;
    loading: boolean;
    error: string | undefined;
    errorCode: string | undefined;
    list: T[];
    singleItem: T | undefined;
}

export const defaultGenericState: GenericState<any> = {
    loadExecuted: false,
    loading: false,
    error: undefined,
    errorCode: undefined,
    list: [],
    singleItem: undefined
}
