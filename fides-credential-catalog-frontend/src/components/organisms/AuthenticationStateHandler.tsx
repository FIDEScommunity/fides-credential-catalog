import React, { FC, PropsWithChildren } from 'react';
import { useKeycloak } from '@react-keycloak/web';

const Authenticated: FC<PropsWithChildren> = (props) => {
    return (<div>
        {props.children}
    </div>);
};

const UnAuthenticated: FC<PropsWithChildren> = (props) => {
    return (<div>
        {props.children}
    </div>);
};
const AuthenticationExpired: FC<PropsWithChildren> = (props) => {
    return (<div>
        {props.children}
    </div>);
};

const Loading: FC<PropsWithChildren> = (props) => {
    return (<div>
        {props.children}
    </div>);
};

type MenuSubComponents = {
    Authenticated: typeof Authenticated
    UnAuthenticated: typeof UnAuthenticated
    AuthenticationExpired: typeof AuthenticationExpired
    Loading: typeof Loading
}
const AuthenticationStateHandler: FC<PropsWithChildren> & MenuSubComponents = (props) => {
    let {keycloak, initialized} = useKeycloak();

    function getChildElement(elementType: React.FC<React.PropsWithChildren>) {
        return React.Children.map(props.children, child => {
                // @ts-ignore
                if (React.isValidElement(child) && (child as React.ReactElement<any>).type.name === elementType.name) {
                    return child as React.ReactElement<any>;
                }
            },
        );
    }

    var componentToShow;
    if (!initialized) {
        componentToShow = getChildElement(Loading);
    } else if (keycloak.authenticated && keycloak.isTokenExpired()) {
        componentToShow = getChildElement(AuthenticationExpired);
    } else {
        componentToShow = getChildElement(keycloak.authenticated ? Authenticated : UnAuthenticated);
    }
    return (<div>
        {componentToShow}
    </div>);


};

AuthenticationStateHandler.Authenticated = Authenticated;
AuthenticationStateHandler.UnAuthenticated = UnAuthenticated;
AuthenticationStateHandler.AuthenticationExpired = AuthenticationExpired;
AuthenticationStateHandler.Loading = Loading;
export default AuthenticationStateHandler;
