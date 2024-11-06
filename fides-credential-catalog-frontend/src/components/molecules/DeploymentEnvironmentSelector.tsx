import { FC, useMemo } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import './LanguageSelector.css';
import { DeploymentEnvironment } from '../../state/slices/model/DeploymentEnvironment';
import { useTranslation } from 'react-i18next';

export interface DeploymentEnvironmentSelectorProps {
    className?: string | undefined;
    selectedValue?: DeploymentEnvironment;
    onValueSelected: (deploymentEnvironment: DeploymentEnvironment) => void;
}

export const DeploymentEnvironmentSelector: FC<DeploymentEnvironmentSelectorProps> = (props) => {
    const {t} = useTranslation();

    let selectedValue = useMemo(() => (props.selectedValue === undefined ? DeploymentEnvironment.SANDBOX : props.selectedValue)
        , [props.selectedValue]);

    const itemTemplate = (option: DeploymentEnvironment) => {
        return (
            <div className="flex align-items-center">
                <div>{t('fields.issuanceConfig.deploymentEnvironment.values.' + option)}</div>
            </div>
        );
    };

    return (
        <div className="">
            <Dropdown className="pr-2" value={selectedValue} onChange={(e: DropdownChangeEvent) => props.onValueSelected(e.value)} options={Object.values(DeploymentEnvironment)}
                      itemTemplate={itemTemplate} valueTemplate={itemTemplate}
            />
        </div>
    )
};

