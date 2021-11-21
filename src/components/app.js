import { h } from 'preact';
import {useEffect, useState} from "preact/hooks";

import Header from './header';
import LoginForm from './login-form';
import ViewThing from './view-thing';
import IcatClient from '../icat.js';
import {invalidateLogin, getCachedSessionId, saveLogin} from '../servercache.js';

const server = "https://icat-dev.isis.stfc.ac.uk";
const client = new IcatClient(server);
async function hasValidCachedSession() {
    const sessionId = getCachedSessionId();
    if (sessionId === null) return false;
    return client.isValidSession(getCachedSessionId());
}

const App = () => {
    const [sessionId, setSessionId] = useState(null);
    const [errMsg, setErrMsg] = useState(null);

    hasValidCachedSession()
        .then(setSessionId(getCachedSessionId()));

    const doLogin = async (plugin, username, password) => {
        const s = await client.login(plugin, username, password)
            .catch(err => setErrMsg(err));
        if (typeof s === "string") {
            setSessionId(s);
            saveLogin(server, s);
            setErrMsg(null);
        }
    };

    const logout = sessionId => {
        client.logout(sessionId);
        invalidateLogin(server)
        setSessionId(null);
    }

    const activeComponent = sessionId === null
        ? <LoginForm doLogin={doLogin} />
        : <ViewThing icatClient={client} sessionId={sessionId} />;

	return (
        <div id="app">
            <Header />
            <div id="mainWindow">
                {sessionId !== null && <button onClick={() => logout(sessionId)}>Logout</button> }
                <h1>Home</h1>
                {activeComponent}
                <p>{errMsg}</p>
            </div>
        </div>
    );
}

export default App;
