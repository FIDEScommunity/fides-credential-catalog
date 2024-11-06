import React, { CSSProperties, PropsWithChildren, useState } from 'react';
import { Image } from 'primereact/image';
import { DisplayProperties } from '../../state';


export interface CredentialTypeCardProps {
    credentialType: any;
    // credentialType: IssuanceConfigCredentialType;
    credentialTypeDisplay: DisplayProperties;
    issuerDisplay: DisplayProperties;
    className?: string | undefined;
    onClick?: (credentialType: any) => void;
}

export const CredentialTypeCard: React.FC<CredentialTypeCardProps & PropsWithChildren> = (props) => {

    const [isBroken, setIsBroken] = useState(false);

    function handleError() {
        setIsBroken(true);
    }

    function getBackground() {
        if (props.credentialTypeDisplay?.backgroundImage?.url) {
            return {backgroundImage: 'url(' + props.credentialTypeDisplay?.backgroundImage?.url + ')', backgroundSize: '100% 100%'};
        } else if (props.issuerDisplay?.backgroundImage?.url) {
            return {backgroundImage: 'url(' + props.issuerDisplay?.backgroundImage?.url + ')', backgroundSize: '100% 100%'};
        } else if (props.credentialTypeDisplay?.backgroundColor) {
            return {backgroundColor: props.credentialTypeDisplay?.backgroundColor};
        } else {
            return {
                backgroundColor: '#f7f9fb',
                border: '1px solid #eaecf1'
            };
        }
    }

    function getTextColor() {
        if (props.credentialTypeDisplay?.backgroundColor) {
            return {color: props.credentialTypeDisplay?.textColor};
        } else {
            return {};
        }
    }

    function getIssuerTextStyle(): CSSProperties {
        return Object.assign({}, getTextColor(), {fontSize: '1.0rem'});
    }

    function getLogo(className: string) {
        if (props.credentialTypeDisplay?.logo?.uri) {
            return (
                <Image className={className}
                       src={isBroken ? '/no_image_available.jpeg': props.credentialTypeDisplay?.logo?.uri}
                       onError={handleError}
                       alt={props.credentialTypeDisplay?.logo?.altText} height="30spx"/>
            )
        } else if (props.issuerDisplay?.logo?.uri) {
            return (
                <img className={className}
                     src={isBroken ? '/no_image_available.jpeg': props.issuerDisplay?.logo?.uri}
                     onError={handleError}
                     alt={props.issuerDisplay?.logo?.altText} style={{
                    maxHeight: '30px',
                    maxWidth: '70px',
                    height: 'auto',
                    width: 'auto'
                }}/>
            )
        } else {
            return null;
        }
    }

    function getCursor() {
        return (props.onClick !== undefined ? {cursor: 'pointer'} : {cursor: 'default'});
    }

    return (
            <div className="mb-2 p-0" style={Object.assign({aspectRatio: 270 / 170, maxWidth: 350, borderRadius: 16}, getCursor(), getBackground())}
                 onClick={event => props.onClick && props.onClick(props.credentialType)}>
                <div className="flex flex-column justify-content-between p-3 " style={{minHeight: '90px', height: '85%'}}>
                    <div className="flex justify-content-between align-items-start">
                        <div className="flex flex-column">
                            <p className="m-0 font-semibold mb-1" style={getIssuerTextStyle()}>{props.issuerDisplay?.name}</p>
                            <p className="m-0 mb-1" style={Object.assign({maxLines: 3, fontSize: '0.75rem'}, getTextColor())}>{props.credentialTypeDisplay?.name}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-column align-items-end" style={{backgroundColor: 'rgba(255,255,255,0.9)', height: '36px', borderBottomLeftRadius: 15, borderBottomRightRadius: 15}}>
                    <div className="flex flex-column justify-content-center " style={{height: '36px'}}>
                        {getLogo("mr-3 flex flex-column justify-content-center")}
                    </div>
                </div>
            </div>
    );
};

