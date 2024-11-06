import React from 'react';
// Supports weights 100-900
import '@fontsource-variable/dm-sans';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Provider } from 'react-redux';
import { store } from './state/store';
import AuthenticationStateHandler from './components/organisms/AuthenticationStateHandler';
import { createBrowserRouter, Route, RouterProvider, Routes } from 'react-router-dom';
import { Login } from './components/pages/Login';
import { CredentialTypeList, I18n, MainMenuLayout } from './components';
import { configureAxiosDefaults } from './AxiosConfig';
import { AuthenticationProvider } from './components/organisms/AuthenticationProvider';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './theme/themes/mytheme/theme.scss';
import 'primeflex/primeflex.scss';
import './App.css';

import { IssuanceConfigList } from './components/pages/issuanceconfig/IssuanceConfigList';
import { IssuanceConfigForm } from './components/pages/issuanceconfig/IssuanceConfigForm';
import { CredentialTypeDetail } from './components/pages/credentialtype/CredentialTypeDetails';
import { UserMaintenanceUserList } from './components/pages/usermaintenance/UserMaintenanceUserList';
import { UserMaintenanceUserForm } from './components/pages/usermaintenance/UserMaintenanceUserForm';
import { OrganizationForm } from './components/pages/organization/OrganizationForm';
import { OrganizationList } from './components/pages/organization/OrganizationList';

function App() {

    configureAxiosDefaults(store);

    const router = createBrowserRouter([
        {
            path: "*", element: <Root/>, handle: {
                crumb: () => "Home"
            }
        },
    ]);

    function Root() {
        // 2️⃣ `BrowserRouter` component removed, but the <Routes>/<Route>
        // component below are unchanged


        return (
            <AuthenticationProvider>
                <AuthenticationStateHandler>
                    <AuthenticationStateHandler.Loading>
                        <div>Loading</div>
                    </AuthenticationStateHandler.Loading>
                    <AuthenticationStateHandler.AuthenticationExpired>
                        <div>Expired token</div>
                    </AuthenticationStateHandler.AuthenticationExpired>
                    <AuthenticationStateHandler.UnAuthenticated>
                        <Routes>
                            <Route path="/" element={<MainMenuLayout/>}>
                                <Route path="/" element={<CredentialTypeList/>}/>
                                <Route path="*" element={<CredentialTypeList/>}/>
                                <Route path="/credentialType" element={<CredentialTypeList/>}/>
                                <Route path="/credentialType/:credentialTypeId" element={<CredentialTypeDetail/>}/>
                                <Route path="/login" element={<Login/>}/>
                            </Route>
                        </Routes>
                    </AuthenticationStateHandler.UnAuthenticated>
                    <AuthenticationStateHandler.Authenticated>
                        <Routes>
                            <Route path="/" element={<MainMenuLayout/>}>
                                <Route path="/" element={<CredentialTypeList/>}/>
                                <Route path="*" element={<CredentialTypeList/>}/>
                                <Route path="/issuanceConfig" element={<IssuanceConfigList/>}/>
                                <Route path="/issuanceConfig/new" element={<IssuanceConfigForm/>}/>
                                <Route path="/issuanceConfig/edit/:issuanceConfigId" element={<IssuanceConfigForm/>}/>
                                <Route path="/credentialType" element={<CredentialTypeList/>}/>
                                <Route path="/credentialType/:credentialTypeId" element={<CredentialTypeDetail/>}/>
                                <Route path="/userMaintenance" element={<UserMaintenanceUserList/>}/>
                                <Route path="/userMaintenance/new" element={<UserMaintenanceUserForm/>}/>
                                <Route path="/userMaintenance/edit/:userId" element={<UserMaintenanceUserForm/>}/>
                                <Route path="/organization" element={<OrganizationList/>}/>
                                <Route path="/organization/new" element={<OrganizationForm/>}/>
                                <Route path="/organization/edit/:organizationId" element={<OrganizationForm/>}/>
                            </Route>
                        </Routes>
                    </AuthenticationStateHandler.Authenticated>
                </AuthenticationStateHandler>
            </AuthenticationProvider>
        );
    }


    return (
        <Provider store={store}>
            <I18n/>
            <PrimeReactProvider>
                <RouterProvider router={router}/>
            </PrimeReactProvider>
        </Provider>
    );
}

export default App;
