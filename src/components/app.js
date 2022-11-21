import { h } from 'preact';
import { useLayoutEffect, useState } from 'preact/hooks';
import { Router, route } from 'preact-router';

import {encodedSearchParams} from '../utils.js';
import IcatClient from '../icat.js';
import About from './about';
import Tips from './tips';
import Header from './header';
import EntityViewer from './entity-viewer';
import ServerConnector from './server-connector';
import {getLastLogin, saveLogin, invalidateLogin} from '../connectioncache.js';

function urlSearchParamsToObj(params) {
    if (params == null) return null;
    const res = {}
    for (const [k, v] of params.entries()) res[k] = v;
    return res;
}

function parseUrlParams(params) {
    if (params == null || params.server == undefined)  return [null, null];
    const connection = {server: params.server, username: params.username};
    const filter = params.table == null
        ? null
        : {
            table: params.table,
            where: params.where,
            offset: params.offset,
            limit: params.limit,
            sortField: params.sortField,
            sortAsc: params.sortAsc,
        };

    return [connection, filter];
}

function toURLParams(connection, filter) {
    const usp = new URLSearchParams();
    if (connection != null) {
        Object.entries(connection)
            .filter(([k, v]) => k != "sessionId" && v != null)
            .forEach(([k, v]) => usp.append(k, v));
    }
    if (filter != null) {
        Object.entries(filter)
            .filter(([k, v]) => v != null)
            .forEach(([k, v]) => usp.append(k, v));
    }
    return usp;
}

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
    const [activeFilter, setActiveFilter] = useState(paramsFilter);

    const activeConnectionIdx = getActiveConnectionIdx(connections, activeConnection);

    const createConnection = (server, username, sessionId) => {
        const newConnection = {server, username, sessionId};
        saveLogin(server, username, sessionId);
        setConnections(connections.concat(newConnection));
        setActiveConnection(newConnection);
        const params = toURLParams(newConnection, activeFilter);
        route(`/icat?${encodedSearchParams(params)}`);
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
            const params = toURLParams(newActiveConnection, null);
            route(`/icat?${encodedSearchParams(params)}`);
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
            const params = e.matches;
            const [activeConn, activeFilter] = parseUrlParams(params);
            setActiveConnection(activeConn);
            setActiveFilter(activeFilter);
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
                    visible={i === activeConnectionIdx}
                    activeFilter={i === activeConnectionIdx ? activeFilter : null} />) }
        </>
    );
}

const Nothing = () => {};

export default App;
