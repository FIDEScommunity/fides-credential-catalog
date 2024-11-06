import React, { ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { useKeycloak } from '@react-keycloak/web';
import { getUser, globalStateSelector, isFidesAdminSelector, useAppDispatch, userSelector } from '../../state';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from 'primereact/icons/chevrondown';
import { MenuItem, MenuItemCommandEvent, MenuItemOptions } from 'primereact/menuitem';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { userPreferenceSelector } from '../../state/slices/userpreference';
import { getStaticData } from '../../state/slices/staticdata';
import './Header.css'

interface Props {
}


export const Header: React.FC<Props> = (props) => {
    const dispatch = useAppDispatch();
    const {keycloak} = useKeycloak();
    const {t} = useTranslation();
    let navigation = useNavigate();
    let globalState = useSelector(globalStateSelector);
    let userPreference = useSelector(userPreferenceSelector).singleItem;
    const isAdmin = useSelector(isFidesAdminSelector);

    useEffect(() => {
        dispatch(getStaticData({}));
    }, []);

    useEffect(() => {
        if (keycloak.token) {
            dispatch(getUser({jwtToken: keycloak.token!}));
        }
    }, [keycloak.token]);
    let user = useSelector(userSelector).singleItem;

    const renderProfileItem = (item: MenuItem, options: MenuItemOptions): ReactNode => {
        return (
            <a className="flex align-items-center gap-2 p-menuitem-link p-0 ml-4" >
                <div className="flex align-items-end justify-content-left gap-2 flex-wrap flex-column" >
                    <div className="text-sm" style={{color: 'var(--black-200)'}}>{user?.fullName}</div>
                    <div className="text-sm" style={{color: 'var(--black-200)'}}>{user?.organization.name}</div>
                </div>
                <ChevronDownIcon color="#1C1C1C66"/>
            </a>
        )
    }

    const items: MenuItem[] = [
        {
            label: 'Projects',
            icon: 'pi pi-search',
            template: renderProfileItem,
            items: [
                {
                    label: t('menu.logoff'),
                    icon: 'pi pi-sign-out',
                    command(event: MenuItemCommandEvent) {
                        keycloak?.logout({redirectUri: window.location.origin + "/"});
                    }
                }
            ]
        }
    ];
    return (
        <div>
            <div className="col-12 p-0" style={{minHeight: '140px'}}>
            <div className="pl-3 md:pl-6 pr-3 md:pr-6 flex align-items-center justify-content-between" style={{minHeight: '140px', backgroundColor: '#0a6ef3'}}>
                <div className="flex align-items-baseline">
                    <a href="https://fides.community" className="font-bold text-white mr-2 md:mr-4 text-3xl md:text-6xl ">FIDES.</a>
                    <a className="text-xl md:text-4xl text-white cursor-pointer" onClick={event => {
                        navigation('/credentialType')
                    }}>Credential Catalog</a>
                </div>
                <div className="flex flex-end">
                    <div className="mr-2"><Button label={t('menu.apiDocs')} link onClick={() => window.location.replace(window.location.origin + '/api/public/swagger-ui')}/></div>

                    {(keycloak.token !== undefined) && (isAdmin === true) && (
                        <div className="mr-2"><Button label={t('menu.userMaintenance')} link onClick={() => navigation('/userMaintenance')}/></div>
                    )}
                    {(keycloak.token !== undefined) && (isAdmin === true) && (
                        <div className="mr-2"><Button label={t('menu.organizationMaintenance')} link onClick={() => navigation('/organization')}/></div>
                    )}
                    {(keycloak.token !== undefined) && (
                        <div className="mr-2"><Button label={t('menu.issuanceConfig')} link onClick={() => navigation('/issuanceConfig')}/></div>
                    )}
                    {(keycloak.token !== undefined) && (
                        <Menubar model={items} style={{border: 'none', backgroundColor: 'none'}} className="headerMenu"/>
                    )}
                    {(keycloak.token === undefined) && (
                        <Button style={{backgroundColor: 'transparent', border: 'solid 1px white'}} onClick={event => navigation(('/login'))}>Login</Button>
                    )}
                </div>
            </div>
                <div style={{borderBottom: 'solid 2px #0a6ef3'}}>
                    <ProgressBar mode={globalState.isLoading ? "indeterminate" : "determinate"} value="100" showValue={false} color={'#0a6ef3'} style={{height: '2px', backgroundColor: '#c8c8c8'}}></ProgressBar>
                </div>
            </div>
        </div>
    );

};


const FidesText = styled.div`
    color: white;
    font-size: calc((2.4 - 1) * 1.2vw + 1rem);
    font-weight: bold;
`;
