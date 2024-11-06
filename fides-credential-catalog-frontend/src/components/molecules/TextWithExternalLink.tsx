import React from 'react';
import { addNonVisibleHtmlBreaks } from '../../utils';
import { TextToHtml } from './TextToHtml';

interface TextWithExternalLinkProps {
    className?: string | undefined;
    label?: string;
    link?: string;
}

export const TextWithExternalLink: React.FC<TextWithExternalLinkProps> = (props) => {

    if (!props.link) {
        return null;
    }
    return (
        <span className={props.className}>
            <a href={props.link} target="_blank" rel="noreferrer"><TextToHtml value={(props.label === undefined) ? props.link : props.label} />
                <span className="ml-1 text-xs pi pi-external-link"/>
            </a>
        </span>
    );
};


