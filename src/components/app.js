import { h } from 'preact';
import { Router, route } from 'preact-router';
import { useEffect, useState } from "preact/hooks";

import Login from '../routes/login';
import Main from '../routes/main';
import About from '../routes/about';
import IcatClient from '../icat.js';
import {invalidateLogin, getCachedSessionId, saveLogin, getLastLogin} from '../servercache.js';
import Header from '../components/header';

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
            .then(s => {
                if (typeof s === "string") {
                    setSessionId(s);
                    saveLogin(server, s);
                    setErrMsg(null);
                    route('/');
                }
            })
            .catch(err => setErrMsg(err));
    };

    const loggedIn = sessionId !== null;
    const logout = () => {
        icatClient.logout(sessionId);
        invalidateLogin(server)
        setSessionId(null);
    }

    return (
        <div id="app">
            <Header
                server={loggedIn ? serverName : null}
                doLogout={logout} />
            <Router>
                <Main path="/" icatClient={icatClient} sessionId={sessionId} />
                <Login path="/login" doLogin={doLogin} errMsg={errMsg} />
                <About path="/about" />
            </Router>
        </div>
    );
}

export default App;
