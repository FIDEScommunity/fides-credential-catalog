import React, { FC, ReactNode } from 'react';
import { Menubar } from 'primereact/menubar';
import { MenuItem, MenuItemCommandEvent, MenuItemOptions } from 'primereact/menuitem';
import { Avatar } from 'primereact/avatar';
import { ChevronDownIcon } from 'primereact/icons/chevrondown';
import { useSelector } from 'react-redux';
import { userSelector } from '../../state';
import { useTranslation } from 'react-i18next';
import { useKeycloak } from '@react-keycloak/web';

export const ProfileMenu: FC = (props) => {
    const {t} = useTranslation();
    let user = useSelector(userSelector).singleItem;
    let {keycloak} = useKeycloak();

    const renderProfileItem = (item: MenuItem, options: MenuItemOptions): ReactNode => {
        return (
            <a className="flex align-items-center p-menuitem-link">
                <Avatar label={user?.fullName.substring(0, 1)} style={{backgroundColor: '#2196F3', color: '#ffffff', height: '32px', minWidth: '32px'}} shape="circle"/>
                <span className="mx-2">{user?.fullName}</span>
                <ChevronDownIcon/>
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
                        keycloak?.logout();
                    }
                }
            ]
        }
    ];

    return (
        <div className="card">
            <Menubar model={items} style={{border: 'none', backgroundColor: 'none'}}/>
            <div className="text-sm" style={{marginLeft: '16px', color: 'rgba(0,0,0,0.4)'}}>{user?.organization.name}</div>
        </div>
    )
}
