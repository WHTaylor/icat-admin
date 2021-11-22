import style from './style.css';

function stripProtocol(s) {
    return s.split("://").slice(-1);
}

const Header = ({server, doLogout}) => (
	<header class={style.header}>
		<h1>ICAT admin{server !== null && ` - ${stripProtocol(server)}`}</h1>
        {server!== null &&
            <button onClick={doLogout}>Logout</button> }
	</header>
);

export default Header;
