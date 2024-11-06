import { ActionReducerMapBuilder, PayloadAction } from '@reduxjs/toolkit';
import { AsyncThunk } from '@reduxjs/toolkit/src/createAsyncThunk';
import { GenericPageableState, GenericState } from './model';

export const addGenericPageableStateSingleBuilders = (builder: ActionReducerMapBuilder<any>, service: AsyncThunk<any, any, any>) => {
    builder.addCase(service.pending.type, (state: GenericPageableState<any>, action) => {
        return {
            ...state,
            loading: true,
            error: undefined,
            errorCode: undefined
        };
    });
    builder.addCase(service.fulfilled.type, (state: GenericPageableState<any>, action: PayloadAction) => {
        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: undefined,
            errorCode: undefined,
            singleItem: Object.assign({}, action.payload)
        };
    });
    builder.addCase(service.rejected.type, (state: GenericPageableState<any>, action: any) => {
        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: getErrorMessageFromMessage(action.error.message),
            errorCode: getErrorCodeFromMessage(action.error.message),
        };
    });

}

export const addGenericPageableStateListBuilders = (builder: ActionReducerMapBuilder<any>, service: AsyncThunk<any, any, any>) => {
    builder.addCase(service.pending.type, (state: GenericPageableState<any>, action) => {
        return {
            ...state,
            loading: true,
            error: undefined,
            errorCode: undefined
        };
    });
    builder.addCase(service.fulfilled.type, (state: GenericPageableState<any>, action: any) => {

        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: undefined,
            errorCode: undefined,
            list: Object.assign([], action.payload.content),
            currentPage: action.payload.page.number,
            totalPages: action.payload.page.totalPages,
            totalElements: action.payload.page.totalElements,
            isLastPage: action.payload.page.last,
            pageSize: action.payload.page.size
        };
    });
    builder.addCase(service.rejected.type, (state: GenericPageableState<any>, action: any) => {
        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: getErrorMessageFromMessage(action.error.message),
            errorCode: getErrorCodeFromMessage(action.error.message),
        };
    });

}

export const addGenericStateListBuilders = (builder: ActionReducerMapBuilder<any>, service: AsyncThunk<any, any, any>) => {
    builder.addCase(service.pending.type, (state: GenericState<any>, action) => {
        return {
            ...state,
            loading: true,
            error: undefined,
            errorCode: undefined
        };
    });
    builder.addCase(service.fulfilled.type, (state: GenericState<any>, action: any) => {
        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: undefined,
            errorCode: undefined,
            list: Object.assign([], action.payload)
        };
    });
    builder.addCase(service.rejected.type, (state: GenericState<any>, action: any) => {
        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: getErrorMessageFromMessage(action.error.message),
            errorCode: getErrorCodeFromMessage(action.error.message),
        };
    });
}

export const addGenericStateSingleBuilders = (builder: ActionReducerMapBuilder<any>, service: AsyncThunk<any, any, any>) => {
    builder.addCase(service.pending.type, (state: GenericState<any>, action) => {
        return {
            ...state,
            loading: true,
            error: undefined,
            errorCode: undefined
        };
    });
    builder.addCase(service.fulfilled.type, (state: GenericState<any>, action: any) => {
        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: undefined,
            errorCode: undefined,
            singleItem: Object.assign({}, action.payload)
        };
    });
    builder.addCase(service.rejected.type, (state: GenericState<any>, action: any) => {
        return {
            ...state,
            loadExecuted: true,
            loading: false,
            error: getErrorMessageFromMessage(action.error.message),
            errorCode: getErrorCodeFromMessage(action.error.message),
        };
    });
}


export function getErrorCodeFromMessage(message: string | undefined): string {
    if (message === undefined) {
        return '';
    } else {
        let startIndex = message.indexOf('[');
        let endIndex = message.indexOf(']');
        if ((startIndex > -1) && (endIndex > -1)) {
            return message.substring(startIndex + 1, endIndex);
        }
    }
    return '';
}

export function getErrorMessageFromMessage(message: string | undefined): string {
    if (message === undefined) {
        return '';
    } else {
        let startIndex = message.indexOf('[');
        let endIndex = message.indexOf(']');
        if ((startIndex > -1) && (endIndex > -1)) {
            return message.substring(endIndex +1)?.trim();
        } else {
            return message;
        }
    }
    return '';
}

export function addQueryParam(url: string, name: string, value: string | string[] | number | number[] | undefined) {
    if (value === undefined) {
        return url;
    }
    if (Array.isArray(value)) {
        value.forEach((element) => {
            url = addQueryParam(url, name, element)
        });
        return url;
    }
    return url + ((url.indexOf('?') === -1) ? '?' : '&') + name + '=' + encodeURIComponent(value.toString());
}
