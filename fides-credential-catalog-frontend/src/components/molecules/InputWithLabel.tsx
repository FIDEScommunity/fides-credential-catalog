import React, { useMemo } from 'react';


export interface InputWithLabelProps {
    label: string | React.ReactNode;
    inputElement: React.ReactNode;
    className?: string | undefined;
    footer?: React.ReactNode | undefined;
    postElement?: React.ReactNode | undefined;
    classNameLabel?: string | undefined;
    classNameValue?: string | undefined;
}

export const InputWithLabel: React.FC<InputWithLabelProps> = (props) => {
    const classNameLabel = useMemo(() => {
        return (props.classNameLabel === undefined) ? 'col-12 md:col-3' : props.classNameLabel;
    }, [props.classNameLabel]);
    const classNameValue = useMemo(() => {
        return (props.classNameValue === undefined) ? 'col-12 md:col-9' : props.classNameValue;
    }, [props.classNameValue]);

    return (
        <div className={"flex-column md:flex-row  field grid md:align-items-center " + props.className} style={{border: 'none', paddingTop: 14}}>
            <div className={classNameLabel} style={{color: 'rgba(28, 28, 28, 0.70)'}}>{props.label}</div>
            <div className={classNameValue}>{props.inputElement}
                {props.postElement && (
                    <>{props.postElement}</>
                )}
            </div>
            {props.footer && (
                <div className="field grid">{props.footer}</div>
            )}
        </div>
    );
};

