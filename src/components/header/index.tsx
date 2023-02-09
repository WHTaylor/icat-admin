import {h} from "preact";
import {route} from 'preact-router';
import {Link} from 'preact-router/match';

import style from './style.css';

import {buildUrl} from '../../routing';
import {Connection} from "../../connectioncache";

function stripProtocol(server) {
    return server.split("://").slice(-1);
}

type Props = {
    connections: Connection[];
    closeConnection: Function;
    activeConnectionIdx: number;
}
/* The header nav bar for the site, with links to active servers and static pages */
const Header = ({connections, closeConnection, activeConnectionIdx}: Props) => {
    const onClickConnectionLink =
        (ev: MouseEvent, i: number, conn: Connection): void => {
            // Middle click to close, left click to activate
            if (ev.buttons !== 4 && ev.buttons !== 1) return
            ev.preventDefault();
            if (ev.buttons === 4) closeConnection(i)
            else route(buildUrl(conn, null));
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
                        isActive={i === activeConnectionIdx}/>)}
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
