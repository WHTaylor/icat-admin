import style from './style.css';
import { Link } from 'preact-router/match';

function stripProtocol(s) {
    return s.split("://").slice(-1);
}

const Header = ({server, userName, doLogout}) => {
    const loggedIn = server !== null;
    const serverInfo = server === null ? "" : stripProtocol(server);
    const userInfo = userName === null || userName === undefined
        ? ""
        : userName.startsWith("anon")
            ? "anon"
            : userName;
    const loginInfo = server === null
        ? null
        : userInfo === null
            ? ` - ${serverInfo}`
            : ` - ${userInfo}@${serverInfo}`;

	return (
        <header class={style.header}>
            <h1>ICAT admin{loginInfo !== null && `${loginInfo}`}</h1>
            <nav>
                {loggedIn
                    ? <Link activeClassName={style.active} href="/">Home</Link>
                    : <Link activeClassName={style.active} href="/login">Login</Link>}
                <Link activeClassName={style.active} href="/about">About</Link>
                {loggedIn &&
                    <Link
                        activeClassName={style.active}
                        href="/login"
                        onClick={doLogout}>Logout</Link> }
            </nav>
        </header>
    )
};

export default Header;
