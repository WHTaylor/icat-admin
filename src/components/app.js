import { h } from 'preact';
import {useEffect, useState} from "preact/hooks";

import Header from './header';
import LoginForm from './login-form';
import ViewThing from './view-thing';
import IcatClient from '../icat.js';

const client = new IcatClient("https://icat-dev.isis.stfc.ac.uk");

// Hack around build error because localStorage not defined for node
// No idea why this is a problem, but it is
const isNode = typeof window === 'undefined';
const setCachedSessionId = isNode
    ? () => {}
    : s => localStorage.setItem("sessionId", s);
const getCachedSessionId = isNode
    ? s => {}
    : () => localStorage.getItem("sessionId");
const clearCachedSessionId = isNode
    ? () => {}
    : () => localStorage.removeItem("sessionId");
async function hasValidCachedSession() {
    var stored = getCachedSessionId();
    if (stored === null) return false;
    return client.isValidSession(stored);
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
            setCachedSessionId(s);
            setErrMsg(null);
        }
    };

    const logout = sessionId => {
        client.logout(sessionId);
        clearCachedSessionId()
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
