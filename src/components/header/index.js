import style from './style.css';
import { useEffect, useState } from "preact/hooks";

import IcatClient from '../../icat.js';

function stripProtocol(s) {
    return s.split("://").slice(-1);
}

const Header = ({
    servers, activePage,
    setActiveServer, closeServer, showLoginForm, showAbout}) =>
{
    const onClickServerLink = (ev, i) => {
        // Middle click to close, left click to activate
        if (ev.buttons !== 4 && ev.buttons !== 1) return
        ev.preventDefault();
        if (ev.buttons === 4) closeServer(i)
        else setActiveServer(i);
    };

    return (
        <header class={style.header}>
            <h1>ICAT admin</h1>
            <nav>
                {servers.map((s, i) =>
                    <ServerLink
                        s={s}
                        handleClick={ev => onClickServerLink(ev, i)}
                        isActive={activePage === i} />)}
                <a
                    onClick={showLoginForm}
                    class={activePage === null && style.active}>+</a>
                <a
                    onClick={showAbout}
                    id={style.aboutLink}
                    class={activePage === "about" && style.active}>
                    About
                </a>
            </nav>
        </header>
    )
};

const ServerLink = ({s, isActive, handleClick}) => {
    const [userName, setUserName] = useState(null);
    useEffect(() => {
        const ps = new IcatClient(s.server, s.sessionId).getUserName()
            .then(res => setUserName(res.userName))
            .catch(console.error);
    }, [s]);

    const prefix = userName === null
        ? ""
        : userName.startsWith("anon") // will be anon/anon, which is unneccessary
            ? "anon@"
            : `${userName}@`;
    return <a onMouseDown={handleClick} class={isActive && style.active}>
            {`${prefix}${stripProtocol(s.server)}`}
        </a>;
}

export default Header;
