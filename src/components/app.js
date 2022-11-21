import { h } from 'preact';
import { useLayoutEffect, useState } from 'preact/hooks';
import { Router, route } from 'preact-router';

import IcatClient from '../icat.js';
import About from './about';
import Tips from './tips';
import Header from './header';
import EntityViewer from './entity-viewer';
import ServerConnector from './server-connector';
import {getLastLogin, saveLogin, invalidateLogin} from '../connectioncache.js';
import {urlSearchParamsToObj, parseUrlParams, encodedSearchParams, buildUrl} from '../routing.js';

function getActiveConnectionIdx(connections, activeConnection) {
    if (activeConnection == null) return null;
    const {server, username} = activeConnection;
    const idx = connections.findIndex(c =>
        c.server === server && c.username === username);
    return idx < 0 ? null : idx;
}

const App = () => {
    // Skip during node prerender
    const usps = typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search);
    const [paramsConn, paramsFilter] = parseUrlParams(urlSearchParamsToObj(usps));

    const [connections, setConnections] = useState([]);
    const [activeConnection, setActiveConnection] = useState(paramsConn);

    const activeConnectionIdx = getActiveConnectionIdx(connections, activeConnection);

    const createConnection = (server, username, sessionId) => {
        const newConnection = {server, username, sessionId};
        saveLogin(server, username, sessionId);
        setConnections(connections.concat(newConnection));
        setActiveConnection(newConnection);
        route(buildUrl(newConnection, paramsFilter));
    };

    const disconnect = i => {
        const c = connections[i];
        invalidateLogin(c.server, c.username);
        new IcatClient(c.server, c.sessionId).logout();
        setConnections(connections.slice(0, i).concat(connections.slice(i + 1)));
    };

    const removeConnection = i => {
        const numConnections = connections.length;

        disconnect(i);
        if (activeConnectionIdx === null) return;

        if (i === activeConnectionIdx) {
            var newActiveConnection;
            if (numConnections == 1) {
                route('/');
                return;
            } else if (i === numConnections - 1) {
                newActiveConnection = connections[numConnections - 2];
            } else {
                newActiveConnection = connections[activeConnectionIdx + 1];
            }
            route(buildUrl(newActiveConnection, null));
        }
    }

    // If on the home or icat page, and no servers are currently active, try to
    // login to the last active server.
    // TODO: if a server is set in URL, load that one rather than last logged in one.
    useLayoutEffect(() => {
        if (location.pathname != "/" && location.pathname != "/icat") return;
        if (connections.length > 0) return;
        const [server, username, sessionId] = getLastLogin();
        if (server == null || sessionId === null) return;
        const client = new IcatClient(server);
        client.isValidSession(sessionId)
            .then(res => {if (res) createConnection(server, username, sessionId)});
    });

    const handleIcatRoute = e => {
        if (e.path != "/icat") setActiveConnection(null);
        else {
            const [newConn, ] = parseUrlParams(e.matches);
            setActiveConnection(newConn);
        }
    }

    return (
        <>
            <Header
                connections={connections}
                closeConnection={removeConnection}
                activeConnectionIdx={activeConnectionIdx} />

            <Router onChange={handleIcatRoute}>
                <Tips path="/tips" />
                <About path="/about" />
                <Nothing path="/icat" />
                <ServerConnector createConnection={createConnection} path="/" />
            </Router>

            {connections.map((c, i) =>
                <EntityViewer
                    key={c.sessionId}
                    server={c.server}
                    sessionId={c.sessionId}
                    visible={i === activeConnectionIdx} />) }
        </>
    );
}

const Nothing = () => {};

export default App;
