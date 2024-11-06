import React from 'react';
import styled from 'styled-components';
import { Key, Logo } from '../atoms';

import { Menu } from 'primereact/menu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
}


export const SideMenu: React.FC<Props> = (props) => {
    const {t} = useTranslation();
    let navigation = useNavigate();

    let items = [{
        items: [
            {
                label: t('menu.credentialTypes'),
                icon: <Key className="mr-2 flex"/>,
                command: () => {
                    navigation('/credentialType');
                }
            },
            {
                label: t('menu.issuanceConfig'),
                icon: <Key className="mr-2 flex"/>,
                command: () => {
                    navigation('/issuanceConfig');
                }
            }
        ]
    }];

    return (
        <Root>
            <div className="flex flex-row justify-content-center mt-3">
                <FidesText>FIDES.</FidesText>
            </div>
            <Menu model={items} className="mt-3" style={{border: 'none'}}/>

            <div className="flex flex-column justify-content-end align-items-center flex-grow-1 pb-2" style={{height: '100%'}}>
                <div className="text-sm mb-2" style={{color: '#000000'}}>Powered by:</div>
                <a href="https://www.credenco.com/?lang=en"><Logo/></a>
            </div>
        </Root>
    );
};

const Root = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 20px 20px 16px;
    height: 100%;
    background-color: #0a6ef3;
`;

const FidesText = styled.div`
    color: white;
    font-size: calc((2.4 - 1) * 1.2vw + 1rem);
    font-weight: bold;
`;

