import style from './style.css';
import { Link } from 'preact-router/match';

function stripProtocol(s) {
    return s.split("://").slice(-1);
}

const Header = ({servers, activeServer, setActiveServer, showLoginForm}) => {
    const serverNames = servers.map(stripProtocol);

	return (
        <header class={style.header}>
            <h1>ICAT admin</h1>
            <nav>
                {serverNames.map((s, i) =>
                    <a
                        onClick={() => setActiveServer(i)}
                        class={i === activeServer
                            ? style.active
                            : style.inactive} >
                        {s}
                    </a>)}
                {servers.length > 0 &&
                <a
                    onClick={showLoginForm}
                    className={activeServer === null
                        ? style.active
                        : style.inactive}>+</a>}

                <Link  href="/about">About</Link>
            </nav>
        </header>
    )
};

export default Header;
