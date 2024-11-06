import React, { useEffect, useRef, useState } from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import './ReadMorePanel.css'

interface ReadMorePanelProps {
    className?: string;
    classNameBody1?: string;
    classNameBody2?: string;
    bodyPart1?: React.ReactNode;
    bodyPart2?: React.ReactNode;
}

export const ReadMorePanel: React.FC<ReadMorePanelProps> = (props) => {
    const ref = useRef<Panel>(null);
    const [collapsed, setCollapsed] = useState<boolean | undefined>();

    useEffect(() => {
        if (collapsed === undefined) {
            return;
        }
        if (collapsed) {
            // @ts-ignore
            ref.current?.collapse();
        } else {
            // @ts-ignore
            ref.current?.expand();
        }
    }, [collapsed]);

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;

        return (
            <div className={className}>
                <div>
                    <div className={props.classNameBody1}>
                        {props.bodyPart1}
                        {(collapsed || collapsed === undefined) &&
                            <Button link className="text-700 text-gray-900 p-0 " onClick={() => {
                                setCollapsed(!collapsed)
                            }}>Read more<span className="text-600 text-gray-900 ml-1 pi pi-angle-double-right"></span>
                            </Button>
                        }
                    </div>
                </div>
            </div>
        );
    };
    return (<Panel className={"read-more-panel " + props.className} style={{padding: '0px'}} ref={ref} toggleable collapsed={true}
                   headerTemplate={headerTemplate}>
            {(<div className={"mt-4 " + props.classNameBody2}>
                    {props.bodyPart2}
                    <Button link className="text-700 text-gray-900 p-0 ml-1 pi pi-angle-double-left" onClick={() => {
                        setCollapsed(!collapsed)
                    }}></Button>
                </div>
            )}
        </Panel>
    );

};


