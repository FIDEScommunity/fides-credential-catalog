import { FC, useMemo } from 'react';
import { FlagIcon } from '../atoms';

export interface LocalesViewProps {
    className?: string | undefined;
    locales?: string[] | string | undefined;
}

export const LocalesView: FC<LocalesViewProps> = (props) => {

    const locales = useMemo(() => {
        return Object.assign([], Array.isArray(props.locales) ? props.locales : [props.locales]);
    }, [props.locales]);

    return (
        <div className={"flex flex-row align-items-center " + props.className}>
            {locales.map((locale: string, index: number) => (
                <div className="flex align-items-center" key={index}>
                    <FlagIcon locale={locale} className="mr-1"/>
                    <span className="text-xs mr-2">{locale}{locale?.length > 0 && locale?.length !== 5 ? ' (Invalid locale)' : ''}</span>
                </div>
            ))}
        </div>
    )
};

