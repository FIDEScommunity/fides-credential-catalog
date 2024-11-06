import { FC, useMemo } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import './LanguageSelector.css';
import { Organization } from '../../state/slices/organization';

export interface OrganizationSelectorProps {
    className?: string | undefined;
    organizations?: Organization[];
    selectedOrganizationId?: string;
    defaultOrganizationId?: string;
    onValueSelected: (organizationId: string) => void;
}

export const OrganizationSelector: FC<OrganizationSelectorProps> = (props) => {

    const itemTemplate = (option: any) => {
        if ((option === null) || (option === undefined) || (option?.name === undefined)) {
            return (
                <div className="flex align-items-center">
                    <div>Select a value</div>
                </div>
            );
        } else {
            return (
                <div className="flex align-items-center">
                    <div>{option?.name}</div>
                </div>
            );
        }
    };

    const selectedOrganization = useMemo(() => {
        if (props.organizations === undefined) {
            return undefined;
        }
        let org = props.organizations.find((organization) => organization.id === (props.selectedOrganizationId !== undefined ? props.selectedOrganizationId : props.defaultOrganizationId));
        return org === undefined ? null : org;

    }, [props.organizations, props.selectedOrganizationId]);
    if ((props.organizations === undefined) || (props.organizations.length === 0) || (selectedOrganization === undefined && props.defaultOrganizationId === undefined)) {
        return null;
    }
    return (
        <div className="">
            <Dropdown className="pr-2"
                      value={selectedOrganization}
                      placeholder="Select a value"
                      onChange={(e: DropdownChangeEvent) => props.onValueSelected(e.value)}
                      options={props.organizations}
                      itemTemplate={itemTemplate} valueTemplate={itemTemplate}
            />
        </div>
    )
};

