import style from './style.css';
import { Link } from 'preact-router/match';

function stripProtocol(s) {
    return s.split("://").slice(-1);
}

const Header = ({server, doLogout}) => {
    const loggedIn = server !== null;
	return (
        <header class={style.header}>
            <h1>ICAT admin{loggedIn && ` - ${stripProtocol(server)}`}</h1>
            <nav>
                {loggedIn
                    ? <Link href="/">Home</Link>
                    : <Link href="/login">Login</Link>}
                <Link href="/about">About</Link>
                {loggedIn && <Link href="/login" onClick={doLogout}>Logout</Link> }
            </nav>
        </header>
    )
};

export default Header;
