import { useKeycloak } from '@react-keycloak/web';
import { FC, useEffect } from 'react';

export const Login: FC = () => {

    const {keycloak, initialized} = useKeycloak();

    useEffect(() => {
        if (initialized) {
            if (!keycloak.authenticated) {
                keycloak.login();
            }
        }
    }, [initialized]);

    return (<div>Login</div>);
};
