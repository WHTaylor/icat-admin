import style from './style.css';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

function stripProtocol(s) {
    return s.split("://").slice(-1);
}

/* The header nav bar for the site, with links to active servers and static pages
 * */
const Header = ({ servers, closeServer, activeServerIdx }) => {
    const onClickServerLink = (ev, i, server) => {
        // Middle click to close, left click to activate
        if (ev.buttons !== 4 && ev.buttons !== 1) return
        ev.preventDefault();
        if (ev.buttons === 4) closeServer(i)
        else route(`/icat?server=${server.server}&username=${server.username}`);
    };

    return (
        <header class={style.header}>
            <h1>ICAT admin</h1>
            <nav>
                {servers.map((s, i) =>
                    <ServerLink
                        // This will break if we allow servers to be reordered
                        key={s + i}
                        s={s}
                        handleClick={ev => onClickServerLink(ev, i, s)}
                        isActive={i === activeServerIdx} />)}
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

const ServerLink = ({s, isActive, handleClick}) => {
    return <a onMouseDown={handleClick} class={isActive && style.active}>
            {`${s.username}@${stripProtocol(s.server)}`}
        </a>;
}

export default Header;
