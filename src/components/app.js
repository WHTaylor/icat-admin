import { h } from 'preact';
import {useEffect, useState} from "preact/hooks";

import Header from './header';
import LoginForm from './login-form';
import ViewThing from './view-thing';
import IcatClient from '../icat.js';
import {invalidateLogin, getCachedSessionId, saveLogin, getLastLogin} from '../servercache.js';

const App = () => {
    const [sessionId, setSessionId] = useState(null);
    const [errMsg, setErrMsg] = useState(null);

    const cached = getLastLogin()
    const serverName = cached === null ? null : cached[0];
    const [server, setServer] = useState(serverName);
    const icatClient = cached === null ? null : new IcatClient(serverName);

    async function hasValidCachedSession() {
        if (serverName === null || cached[1] === undefined) return false;
        return icatClient.isValidSession(cached[1]);
    }

    useEffect(() => {
        hasValidCachedSession()
            .then(res => {if (res) setSessionId(getCachedSessionId())})
    });


    const doLogin = async (server, plugin, username, password) => {
        const client = new IcatClient(server);
        setServer(server);
        const s = await client.login(plugin, username, password)
            .catch(err => setErrMsg(err));
        if (typeof s === "string") {
            setSessionId(s);
            saveLogin(server, s);
            setErrMsg(null);
        }
    };

    const loggedIn = sessionId !== null;
    const logout = sessionId => {
        icatClient.logout(sessionId);
        invalidateLogin(server)
        setSessionId(null);
    }

    const activeComponent = loggedIn
        ? <ViewThing icatClient={icatClient} sessionId={sessionId} />
        : <LoginForm doLogin={doLogin} />;

	return (
        <div id="app">
            <Header server={loggedIn ? serverName : null}/>
            <div id="mainWindow">
                {loggedIn &&
                    <button onClick={() => logout(sessionId)}>Logout</button> }
                <h1>Home</h1>
                {activeComponent}
                <p>{errMsg}</p>
            </div>
        </div>
    );
}

export default App;
