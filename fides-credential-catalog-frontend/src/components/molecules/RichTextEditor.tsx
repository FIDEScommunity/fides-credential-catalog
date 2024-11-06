import React from 'react';
import { Editor } from 'primereact/editor';
import * as DOMPurify from 'dompurify';


export interface RichTextEditorProps {
    value?: string | undefined;
    onChangeValue: (value: string | undefined | null) => void;
    placeHolder?: string | undefined;
    className?: string | undefined;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = (props) => {


    const renderHeader = () => {
        return (
            <span className="ql-formats">
                <span className="ql-formats">
                    <button className="ql-bold" aria-label="Bold"></button>
                    <button className="ql-italic" aria-label="Italic"></button>
                    <button className="ql-underline" aria-label="Underline"></button>
                    <button className="ql-strike" aria-label="Strike"></button>
                </span>

                <span className="ql-formats">
                    <select className="ql-color"></select>
                        <span className="ql-formats">
                    </span>
                </span>

                <span className="ql-formats">
                  <button className="ql-header" value="1"></button>
                  <button className="ql-header" value="2"></button>
                  <button className="ql-header" value="3"></button>
                </span>

                <span className="ql-formats">
                  <button className="ql-list" value="ordered"></button>
                  <button className="ql-list" value="bullet"></button>
                </span>
                <span className="ql-formats">
                  <button className="ql-indent" value="-1"></button>
                  <button className="ql-indent" value="+1"></button>
                </span>
                <span className="ql-formats">
                    <button className="ql-clean"></button>
                </span>
            </span>
        );
                };

    const header = renderHeader();

    return (
        <Editor value={props.value}
                onTextChange={(e) => props.onChangeValue(DOMPurify.sanitize(e.htmlValue+''))}
                headerTemplate={header}
                style={{backgroundColor: 'white', minHeight: '80px', borderRadius: '4px'}}/>
    )
                };

