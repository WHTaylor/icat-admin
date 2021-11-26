import { h } from 'preact';
import { Router, route } from 'preact-router';
import { useLayoutEffect, useEffect, useState } from "preact/hooks";

import Page from './page';
import Login from '../routes/login';
import About from '../routes/about';
import IcatClient from '../icat.js';
import {invalidateLogin, getCachedSessionId, saveLogin, getLastLogin} from '../servercache.js';
import Header from '../components/header';
import EntityViewer from '../components/entity-viewer';

const App = () => {
    const [sessionId, setSessionId] = useState(null);
    const [errMsg, setErrMsg] = useState(null);

    const [cachedServer, cachedSessionId] = getLastLogin();

    const [server, setServer] = useState(cachedServer);
    const [userName, setUserName] = useState(null);
    const icatClient = cachedServer === null ? null : new IcatClient(cachedServer);

    useLayoutEffect(() => {
        async function hasValidCachedSession() {
            if (cachedServer === null || cachedSessionId === null) return false;
            return icatClient.isValidSession(cachedSessionId);
        }

        hasValidCachedSession()
            .then(res => {
                if (res) setSessionId(cachedSessionId);
                else route("/login");
            })
            .catch(err => route("/login"));
    });

    useEffect(async () => {
        async function getUser() {
            return await icatClient.getUserName(sessionId)
                .then(r => r.userName);
        }

        if (sessionId !== null) {
            getUser().then(u => setUserName(u));
        }
    }, [sessionId]);

    const doLogin = async (server, plugin, username, password) => {
        const client = new IcatClient(server);
        const s = await client.login(plugin, username, password)
            .then(s => {
                if (typeof s === "string") {
                    setServer(server);
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
                server={loggedIn ? cachedServer : null}
                userName={userName}
                doLogout={logout} />
            <Router>
                <Page path="/">
                    <EntityViewer icatClient={icatClient} sessionId={sessionId} />
                </Page>
                <Page path="/login">
                    <Login path="/login" doLogin={doLogin} errMsg={errMsg} />
                </Page>
                <Page path="/about">
                    <About />
                </Page>
            </Router>
        </div>
    );
}

export default App;
