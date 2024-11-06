import { Outlet } from 'react-router-dom';

import React from 'react';
import { Header } from '../organisms/Header';
import styled from 'styled-components';
import { ToastContainer } from '../molecules/ToastContainer';

export const MainMenuLayout = () => {
    return (
        <Root>
            <ContentContainer>
                <Header/>
                <BodyContainer>
                    <ToastContainer/>
                    <Outlet/>
                </BodyContainer>
            </ContentContainer>
        </Root>
    );
};


const Root = styled.div`
    margin: 0 auto;
    min-height: 100vh;
    width: 100%;
`;
const BodyContainer = styled.div`
    padding-top: 20px;
    padding-right: 20px;
    padding-left: 20px;
`;
const ContentContainer = styled.div`
    width: 100%;
`;
