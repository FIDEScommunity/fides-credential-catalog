import { FC, useMemo } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import './LanguageSelector.css';
import { VisibilityStatus } from '../../state/slices/model/VisibilityStatus';
import { useTranslation } from 'react-i18next';

export interface VisibilityStatusSelectorProps {
    className?: string | undefined;
    selectedValue?: VisibilityStatus;
    onValueSelected: (VisibilityStatus: VisibilityStatus) => void;
}

export const VisibilityStatusSelector: FC<VisibilityStatusSelectorProps> = (props) => {
    const {t} = useTranslation();

    let selectedValue = useMemo(() => (props.selectedValue === undefined ? VisibilityStatus.PRIVATE : props.selectedValue)
        , [props.selectedValue]);

    const itemTemplate = (option: VisibilityStatus) => {
        return (
            <div className="flex align-items-center">
                <div>{t('fields.issuanceConfig.visibilityStatus.values.' + option)}</div>
            </div>
        );
    };

    return (
        <div className="">
            <Dropdown className="pr-2" value={selectedValue} onChange={(e: DropdownChangeEvent) => props.onValueSelected(e.value)} options={Object.values(VisibilityStatus)}
                      itemTemplate={itemTemplate} valueTemplate={itemTemplate}
            />
        </div>
    )
};

