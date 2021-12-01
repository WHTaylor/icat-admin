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
    const [cachedServer, cachedSessionId] = getLastLogin();

    const [errMsg, setErrMsg] = useState(null);
    const [server, setServer] = useState(cachedServer);
    const [icatClient, setIcatClient] =
        useState(cachedServer === null ? null : new IcatClient(cachedServer));
    const [userName, setUserName] = useState(null);

    useLayoutEffect(() => {
        const hasValidCachedSession = async () =>
            new IcatClient(cachedServer).isValidSession(cachedSessionId);

        const sendToLogin = () => {
            setIcatClient(null);
            route("/login");
        };

        if (icatClient === null || cachedSessionId === null)
            sendToLogin();
        else if (!icatClient.loggedIn) {
            hasValidCachedSession()
                .then(res => {
                    if (res) {
                        setIcatClient(new IcatClient(server, cachedSessionId));
                        route('/');
                    } else sendToLogin();
                })
                .catch(err => sendToLogin());
        }
    });

    useEffect(async () => {
        async function getUser() {
            return await icatClient.getUserName()
                .then(r => r.userName);
        }

        if (icatClient !== null && icatClient.loggedIn) {
            getUser().then(u => setUserName(u));
        }
    }, [icatClient]);

    const doLogin = async (server, plugin, username, password) => {
        const client = new IcatClient(server);
        await client.login(plugin, username, password)
            .then(s => {
                if (typeof s === "string") {
                    setServer(server);
                    setIcatClient(new IcatClient(server, s));
                    saveLogin(server, s);
                    setErrMsg(null);
                    route('/');
                }
            })
            .catch(err => setErrMsg(err));
    };

    const logout = () => {
        icatClient.logout();
        invalidateLogin(server)
        setIcatClient(null);
    }

    return (
        <div id="app">
            <Header
                server={icatClient !== null && icatClient.loggedIn ? cachedServer : null}
                userName={userName}
                doLogout={logout} />
            <Router>
                <Page path="/">
                    <EntityViewer icatClient={icatClient} />
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
