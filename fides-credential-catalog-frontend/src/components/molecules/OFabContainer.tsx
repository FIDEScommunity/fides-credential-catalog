import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

interface OFabProps {
    className?: string | undefined;
}

export const OFabContainer: React.FC<OFabProps & PropsWithChildren> = (props) => {
    return (
        <div className={props.className} style={{position: 'fixed', bottom: '3rem', right: '3rem'}}>
            <Fab>{props.children}</Fab>
        </div>
    );
};

const Fab = styled.div`
    position: absolute;
    bottom: -1rem;
    right: -1rem;
    z-index: 1;

    display: inline-flex;
    padding: 28px;
    align-items: center;
    align-content: center;
    gap: 8px 8px;
    flex-wrap: wrap;


    border-radius: 16px;
    border: 1px solid rgba(28, 28, 28, 0.10);
    background: rgba(255, 255, 255, 0.80);
    /* BG blur 40 */
    backdrop-filter: blur(20px);


    :before {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
    }
`

