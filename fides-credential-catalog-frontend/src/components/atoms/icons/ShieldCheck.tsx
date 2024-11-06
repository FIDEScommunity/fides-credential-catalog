import React from 'react';
import { IconProps } from './IconProps';


export const ShieldCheck: React.FC<IconProps> = ({width = '20', height = "20", className}: IconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 32 32" fill="none" className={className}>
            <path
                d="M27 14V7C27 6.73478 26.8946 6.48043 26.7071 6.29289C26.5196 6.10536 26.2652 6 26 6H6C5.73478 6 5.48043 6.10536 5.29289 6.29289C5.10536 6.48043 5 6.73478 5 7V14C5 26 16 29 16 29C16 29 27 26 27 14Z"
                stroke="#343330" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11 17L14 20L21 13" stroke="#343330" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    )
};
