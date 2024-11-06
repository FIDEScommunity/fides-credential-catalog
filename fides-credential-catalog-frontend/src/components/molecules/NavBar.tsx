import React, { FC, PropsWithChildren, useEffect, useState } from 'react';


export const NavBar: FC<PropsWithChildren> = (props) => {
// export default function Navbar() {
    const [stickyClass, setStickyClass] = useState('relative');

    useEffect(() => {
        window.addEventListener('scroll', stickNavbar);

        return () => {
            window.removeEventListener('scroll', stickNavbar);
        };
    }, []);

    const stickNavbar = () => {
        if (window !== undefined) {
            let windowHeight = window.scrollY;
            windowHeight > 148 ? setStickyClass('fixed ') : setStickyClass('relative');
        }
    };

    return <div className={`${stickyClass}`} style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '25%',

    }}>{props.children}</div>;
}
