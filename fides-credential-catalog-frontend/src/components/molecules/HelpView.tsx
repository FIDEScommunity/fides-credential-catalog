import React, { FC, useRef } from 'react';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';

export interface HelpViewProps {
    className?: string | undefined;
    panelClassName?: string | undefined;
    helpText: string | React.ReactNode;
}

export const HelpView: FC<HelpViewProps> = (props) => {
    const op = useRef<OverlayPanel>(null);

    return (
        <div className={"card flex justify-content-center " + props.className}>
            <Button type="button"  icon="pi pi-question-circle" style={{backgroundColor: '#ffffff', color: '#575757', border: 'none'}} onClick={(e) => op.current?.toggle(e)}/>
            <OverlayPanel ref={op} className={props.panelClassName}>
                {props.helpText}
            </OverlayPanel>
        </div>
    );
}
