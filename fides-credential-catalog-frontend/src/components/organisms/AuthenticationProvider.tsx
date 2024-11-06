import React, { FC, PropsWithChildren } from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import Keycloak from "keycloak-js";
import { BoldText } from "../atoms/texts/BoldText";


interface AuthenticationProviderProps {
}

export const AuthenticationProvider: FC<AuthenticationProviderProps & PropsWithChildren> = (props) => {


    const keycloak = new Keycloak({
        "url": process.env.REACT_APP_KEYCLOAK_URL,
        "realm": process.env.REACT_APP_KEYCLOAK_REALM!,
        "clientId": process.env.REACT_APP_KEYCLOAK_CLIENT!,
    })
    // "enable-cors": true
    const initOptions = {pkceMethod: 'S256', checkLoginIframe : false}


    const loadingComponent = (
        <BoldText></BoldText>
    )

    return (
        <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={initOptions}
            LoadingComponent={loadingComponent}>
            {props.children}
        </ReactKeycloakProvider>)
};
