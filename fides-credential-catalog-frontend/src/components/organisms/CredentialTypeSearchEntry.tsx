import { CredentialTypeSearchForm, credentialTypeSearchFormSelector, setCredentialTypeSearchForm } from '../../state/slices/credentialtypesearchform';
import { useSelector } from 'react-redux';
import { FilterCheckboxes, LocalesView, TextInput, TextToHtml } from '../molecules';
import { DeploymentEnvironment, useAppDispatch } from '../../state';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CredentialKind } from '../../state/slices/model/CredentialKind';
import { staticDataSelector } from '../../state/slices/staticdata';
import { Logo } from '../atoms';


export interface CredentialTypeSearchEntryProps {
    title: string;
    onSearch: (form: CredentialTypeSearchForm | undefined) => void;
    placeHolder?: string;
    className?: string;
}


export const CredentialTypeSearchEntry: React.FC<CredentialTypeSearchEntryProps> = (props) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();
    let form = useSelector(credentialTypeSearchFormSelector);
    let staticData = useSelector(staticDataSelector);

    function setSearchTextValue(value: string | undefined) {
        dispatch(setCredentialTypeSearchForm({searchText: value}));
        if (props.onSearch) {
            if (searchTimeout) clearTimeout(searchTimeout);
            setSearchTimeout(setTimeout(() => {
                let newForm = Object.assign({}, form, {searchText: value});
                if (props.onSearch) {
                    props.onSearch(newForm);
                }
            }, 400));
        }
    }

    const onCheckboxValuesChanged = (formAttributeName: string, values: string[]) => {
        let newForm = Object.assign({}, form, {[formAttributeName]: values});
        dispatch(setCredentialTypeSearchForm(newForm));
        if (props.onSearch) {
            props.onSearch(newForm);
        }
    }

    return (
        <div className={"h-full flex flex-column justify-content-start pb-8 " + props.className}>
            <div>
            <div className="font-semibold pb-4">{t('screens.credentialTypeList.title')}</div>
            <TextInput className="w-full" value={form.searchText} onChangeValue={(value) => setSearchTextValue(value)} placeHolder={t('screens.credentialTypeList.freeSearchPlaceholder')}/>

            <FilterCheckboxes
                title={t('fields.issuanceConfig.deploymentEnvironment.typeDescription')}
                keys={Object.keys(DeploymentEnvironment)}
                selectedValues={form.deploymentEnvironment}
                onChangeValue={values => onCheckboxValuesChanged('deploymentEnvironment', values)}
                labelProvider={(key) => t('fields.issuanceConfig.deploymentEnvironment.values.' + key)}
            />
            <FilterCheckboxes
                title={t('fields.issuanceConfigCredentialType.credentialFormat.typeDescription')}
                keys={staticData.singleItem?.credentialFormat}
                selectedValues={form.credentialFormat}
                onChangeValue={values => onCheckboxValuesChanged('credentialFormat', values)}
                labelProvider={(key) => key}
            />
            <FilterCheckboxes
                title={t('fields.issuanceConfigCredentialType.credentialKind.typeDescription')}
                keys={Object.keys(CredentialKind)}
                selectedValues={form.credentialKind}
                onChangeValue={values => onCheckboxValuesChanged('credentialKind', values)}
                labelProvider={(key) => t('fields.issuanceConfigCredentialType.credentialKind.values.' + key)}
            />
            <FilterCheckboxes
                title={t('fields.issuanceConfig.grantTypesSupported.typeDescription')}
                keys={staticData.singleItem?.grantTypesSupported}
                selectedValues={form.grantTypesSupported}
                onChangeValue={values => onCheckboxValuesChanged('grantTypesSupported', values)}
                labelProvider={(key) => key}
            />
            <FilterCheckboxes
                title={t('fields.issuanceConfigCredentialType.cryptographicBindingMethodsSupported.typeDescription')}
                keys={staticData.singleItem?.cryptographicBindingMethodsSupported}
                selectedValues={form.cryptographicBindingMethodsSupported}
                onChangeValue={values => onCheckboxValuesChanged('cryptographicBindingMethodsSupported', values)}
                labelProvider={(key) => key}
            />
            <FilterCheckboxes
                title={t('fields.issuanceConfigCredentialType.credentialSigningAlgValuesSupported.typeDescription')}
                keys={staticData.singleItem?.credentialSigningAlgValuesSupported}
                selectedValues={form.credentialSigningAlgValuesSupported}
                onChangeValue={values => onCheckboxValuesChanged('credentialSigningAlgValuesSupported', values)}
                labelProvider={(key) => key}
            />
            <FilterCheckboxes
                title={t('fields.issuanceConfigCredentialType.locale.typeDescription')}
                keys={staticData.singleItem?.locale}
                selectedValues={form.locale}
                onChangeValue={values => onCheckboxValuesChanged('locale', values)}
                labelProvider={(key) => <LocalesView locales={key}/>}
            />

        </div>
            <div className="hidden md:flex flex-column justify-content-end align-items-center flex-grow-1 pb-2" style={{height: '100%'}}>
                <div className="text-sm mb-2" style={{color: '#000000'}}>Powered by:</div>
                <a href="https://www.credenco.com/?lang=en"><Logo/></a>
            </div>
        </div>
    );
};

