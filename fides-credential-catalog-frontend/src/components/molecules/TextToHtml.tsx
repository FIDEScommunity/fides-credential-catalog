import React, { useMemo } from 'react';
import * as DOMPurify from 'dompurify';
import './TextToHtml.css'
import { addNonVisibleHtmlBreaks } from '../../utils';

export interface TextToHtmlProps {
    value?: string | undefined;
    addNonVisibleHtmlBreaks?: boolean | undefined;
}

export const TextToHtml: React.FC<TextToHtmlProps> = (props) => {


    const htmlSanitized = useMemo(() => {
        if (props.value === undefined) {
            return '';
        }

        if (props.addNonVisibleHtmlBreaks === undefined || props.addNonVisibleHtmlBreaks) {
            return DOMPurify.sanitize(addNonVisibleHtmlBreaks(props.value!));
        }
        return DOMPurify.sanitize(props.value!);
    }, [props.value]);

    if (props.value === undefined) {
        return null;
    }

    return (
            <span className="text-to-html"
                dangerouslySetInnerHTML={{
                    __html: htmlSanitized,
                }}
            ></span>
    )
};

