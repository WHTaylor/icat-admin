import { h } from 'preact';
import { useLayoutEffect, useState } from 'preact/hooks';
import { Router, route } from 'preact-router';

import IcatClient from '../icat.js';
import About from './about';
import Tips from './tips';
import Header from './header';
import EntityViewer from './entity-viewer';
import ServerConnector from './server-connector';
import {getLastLogin, saveLogin, invalidateLogin} from '../servercache.js';

function urlSearchParamsToObj(params) {
    if (params == null) return null;
    const res = {}
    for (const [k, v] of params.entries()) res[k] = v;
    return res;
}

function parseUrlParams(params) {
    if (params == null || params.server == undefined)  return [null, null];
    const connection = {server: params.server, username: params.username};
    const filter = params.table === null || params.table === undefined
        ? null
        : {
            table: params.table,
            where: params.where,
            offset: params.offset,
            limit: params.limit,
        };

    return [connection, filter];
}

function getActiveConnectionIdx(connections, activeConnection) {
    if (activeConnection === null) return null;
    const {server, username} = activeConnection;
    const idx = connections.findIndex(c =>
        c.server === server
        && c.username === username);
    return idx < 0 ? null : idx;
}

const App = () => {
    // Skip during node prerender
    const usps = typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search);
    const [paramsConn, paramsFilter] = parseUrlParams(urlSearchParamsToObj(usps));

    const [connections, setConnections] = useState([]);
    const initActiveServerIdx = getActiveConnectionIdx(connections, paramsConn);
    const [activeServerIdx, setActiveServerIdx] = useState(initActiveServerIdx);
    const [activeFilter, setActiveFilter] = useState(paramsFilter);

    const createConnection = (server, username, sessionId) => {
        const numConnections = connections.length;
        setConnections(
            connections.concat({server, username, sessionId}));
        saveLogin(server, username, sessionId);
        setActiveServerIdx(numConnections);
        route(`/icat?server=${server}&username=${username}`);
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
        if (activeServerIdx === null) return;

        if (i < activeServerIdx) {
            setActiveServerIdx(activeServerIdx - 1);
        } else if (i === activeServerIdx) {
            if (i === 0) {
                if (numConnections === 1) setActiveServerIdx(null);
                else setActiveServerIdx(-1);
            } else if (i === numConnections - 1) {
                setActiveServerIdx(activeServerIdx - 1)
            };
        }
    }

    // If no servers are currently active, try to login to the last active server
    // TODO: Make this take into account the URL - if on tips/about don't load,
    // if has a server set load that one rather than last logged in one.
    useLayoutEffect(() => {
        if (connections.length > 0) return;
        const [server, username, sessionId] = getLastLogin();
        if (server == null || sessionId === null) return;
        const client = new IcatClient(server);
        client.isValidSession(sessionId)
            .then(res => {if (res) createConnection(server, username, sessionId)});
    });

    const handleIcatRoute = e => {
        if (e.path != "/icat") setActiveServerIdx(null);
        else {
            const params = e.matches;
            const [activeConn, activeFilter] = parseUrlParams(params);
            const idx = getActiveConnectionIdx(connections, activeConn)
            setActiveServerIdx(idx);
            setActiveFilter(activeFilter);
        }
    }

    return (
        <>
            <Header
                servers={connections}
                closeServer={removeConnection}
                activeServerIdx={activeServerIdx} />

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
                    visible={i === activeServerIdx}
                    activeFilter={i === activeServerIdx ? activeFilter : null} />) }
        </>
    );
}

const Nothing = () => {};

export default App;
