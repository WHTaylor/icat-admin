import style from './style.module.css';
import CloseButton from '../controls/close-button';

import {Connection} from "../../connectioncache";
import {Page} from "../../entityState";

function stripProtocol(server: string) {
    return server.split("://").slice(-1);
}


type Props = {
    connections: Connection[];
    activePage: Page;
    setActivePage: (i: Page) => void;
    closeConnection: Function;
}
/**
 * The header nav bar for the site, with links to active connections, and the
 * static pages
 */
const Header = (
    {
        connections,
        activePage,
        setActivePage,
        closeConnection
    }: Props) => {
    return (
        <header class={style.header}>
            <h1>ICAT admin</h1>
            <nav>
                {connections.map((conn, i) =>
                    <ConnectionLink
                        // This will break if we allow connections to be reordered
                        key={i}
                        conn={conn}
                        isActive={i === activePage}
                        setActiveConnection={() => setActivePage(i)}
                        closeConnection={() => closeConnection(i)}
                    />)}
                <a
                    class={activePage === undefined && style.active}
                    onClick={() => setActivePage(undefined)}
                >
                    +
                </a>
                <a
                    id={style.tipsLink}
                    class={activePage === "tips" && style.active}
                    onClick={() => setActivePage("tips")}
                >
                    Tips
                </a>
                <a
                    class={activePage === "about" && style.active}
                    onClick={() => setActivePage("about")}
                >
                    About
                </a>
            </nav>
        </header>
    )
};

const ConnectionLink = (
    {
        conn,
        isActive,
        setActiveConnection,
        closeConnection
    }: {
        conn: Connection,
        isActive: boolean,
        setActiveConnection: () => void,
        closeConnection: () => void,
    }) => {
    // Close on middle click, set active on left click
    const handleClick = (ev: MouseEvent) => {
        if (ev.buttons !== 4 && ev.buttons !== 1) return;
        ev.preventDefault();
        if (ev.buttons === 4) closeConnection()
        else setActiveConnection();
    }
    return <a
        onMouseDown={handleClick}
        class={isActive && style.active}>
        <span class={style.headerButtonContainer}>
            {`${conn.username}@${stripProtocol(conn.server)}`}
            <CloseButton
                onClickHandler={closeConnection}
                additionalClass={style.closeButton}
            />
        </span>
    </a>;
}

export default Header;
