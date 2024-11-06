import React, { useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { useSelector } from 'react-redux';
import { setToastMessage, toastMessageSelector } from '../../state/slices/toast';
import { useAppDispatch } from '../../state';


export const ToastContainer: React.FC = () => {
    const toastRef = React.useRef<Toast>(null);
    const dispatch = useAppDispatch();

    let toastMessage = useSelector(toastMessageSelector);
    useEffect(() => {
        if (toastMessage !== undefined && toastMessage.message !== undefined) {
            toastRef.current?.show({severity: 'success', summary: 'Success', detail: toastMessage.message});
            dispatch(setToastMessage({message: undefined}));
        }
    }, [toastMessage]);
    return (
        <Toast ref={toastRef} position="bottom-left"/>
    );
};

