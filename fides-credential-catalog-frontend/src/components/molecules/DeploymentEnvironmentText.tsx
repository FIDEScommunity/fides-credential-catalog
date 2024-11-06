import React from 'react';
import { DeploymentEnvironment } from '../../state';
import { useTranslation } from 'react-i18next';

interface DeploymentEnvironmentTextProps {
    deploymentEnvironment?: DeploymentEnvironment | string | undefined;
}

export const DeploymentEnvironmentText: React.FC<DeploymentEnvironmentTextProps> = (props) => {
    const {t} = useTranslation();
    if (!props.deploymentEnvironment) {
        return null;
    }
    return (<span>{t('fields.issuanceConfig.deploymentEnvironment.values.' + props.deploymentEnvironment)}</span>);
};


