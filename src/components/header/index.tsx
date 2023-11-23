import {Link} from 'preact-router/match';

import style from './style.css';

import {Connection} from "../../connectioncache";

function stripProtocol(server: string) {
    return server.split("://").slice(-1);
}


type Props = {
    connections: Connection[];
    activeConnection: number | null
    setActiveConnection: (i: number) => void;
    closeConnection: Function;
}
/**
 * The header nav bar for the site, with links to active connections, and the
 * static pages
 */
const Header = ({connections, activeConnection, setActiveConnection, closeConnection}: Props) => {
    const onClickConnectionLink =
        (ev: MouseEvent, i: number, conn: Connection): void => {
            // Middle click to close, left click to activate
            if (ev.buttons !== 4 && ev.buttons !== 1) return
            ev.preventDefault();
            if (ev.buttons === 4) closeConnection(i)
            else setActiveConnection(i);
        };

    return (
        <header class={style.header}>
            <h1>ICAT admin</h1>
            <nav>
                {connections.map((conn, i) =>
                    <ConnectionLink
                        // This will break if we allow connections to be reordered
                        key={i}
                        conn={conn}
                        handleClick={ev => onClickConnectionLink(ev, i, conn)}
                        isActive={i === activeConnection}/>)}
                <Link activeClassName={style.active} href="/">
                    +
                </Link>
                <Link activeClassName={style.active} id={style.tipsLink} href="/tips">
                    Tips
                </Link>
                <Link activeClassName={style.active} href="/about">
                    About
                </Link>
            </nav>
        </header>
    )
};

const ConnectionLink = ({conn, isActive, handleClick}:
                            {
                                conn: Connection,
                                isActive: boolean,
                                handleClick: (ev: MouseEvent) => void
                            }) => {
    return <a onMouseDown={handleClick} class={isActive && style.active}>
        {`${conn.username}@${stripProtocol(conn.server)}`}
    </a>;
}

export default Header;
