import style from './style.css';

function stripProtocol(s) {
    return s.split("://").slice(-1);
}

const Header = ({
    servers, activePage,
    setActiveServer, showLoginForm, showAbout}) =>
{
    const serverNames = servers.map(stripProtocol);

	return (
        <header class={style.header}>
            <h1>ICAT admin</h1>
            <nav>
                {serverNames.map((s, i) =>
                    <a
                        onClick={() => setActiveServer(i)}
                        class={i === activePage
                            ? style.active
                            : style.inactive} >
                        {s}
                    </a>)}
                {(servers.length > 0 || activePage == "about") &&
                    <a
                        onClick={showLoginForm}
                        className={activePage === null
                            ? style.active
                            : style.inactive}>+</a>}

                <a
                    onClick={showAbout}
                    className={activePage === "about"
                        ? style.active
                        : style.inactive}>
                    About
                </a>
            </nav>
        </header>
    )
};

export default Header;
