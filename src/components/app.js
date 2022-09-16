import { h } from 'preact';
import { useLayoutEffect, useState } from "preact/hooks";

import IcatClient from '../icat.js';
import About from './about';
import Tips from './tips';
import Header from './header';
import EntityViewer from './entity-viewer';
import ServerConnector from './server-connector';
import {getLastLogin, saveLogin, invalidateLogin} from '../servercache.js';

import dayjs from 'dayjs';

function formatLog(level, msg) {
    return `${dayjs().format()} ${level} - ${msg}`;
}

global.log = {
    info: msg => console.log(formatLog("INFO", msg)),
    warn: msg => console.warn(formatLog("WARN", msg)),
    error: msg => console.error(formatLog("ERROR", msg)),
}

const App = () => {
    const [connections, setConnections] = useState([]);
    // activePage is one of
    //  - null - show a login page
    //  - "about" - show the about page
    //  - "tips" - show the tips page
    //  - A number - show EntityViewer for the corresponding server
    const [activePage, setActivePage] = useState(null);

    const aServerIsActive = () => typeof activePage === "number";
    const createConnection = (server, sessionId) => {
        const numConnections = connections.length;
        setConnections(
            connections.concat({server, sessionId}));
        setActivePage(numConnections);
        saveLogin(server, sessionId);
    };

    const disconnect = i => {
        const c = connections[i];
        invalidateLogin(c.server);
        new IcatClient(c.server, c.sessionId).logout();
        setConnections(connections.slice(0, i).concat(connections.slice(i + 1)));
    };

    const removeConnection = i => {
        const numConnections = connections.length;

        disconnect(i);

        // Select correct page
        if (!aServerIsActive) return;

        if (i < activePage) {
            setActivePage(activePage - 1);
        } else if (i === activePage) {
            if (i === 0) {
                if (numConnections === 1) setActivePage(null);
                else setActivePage(-1);
            }
            else if (i === numConnections - 1) setActivePage(activePage - 1);
        }
    }

    // If no servers are currently active, try to login to the last active server
    useLayoutEffect(() => {
        if (connections.length > 0) return;
        const [server, sessionId] = getLastLogin();
        if (server == null || sessionId === null) return;
        const client = new IcatClient(server);
        client.isValidSession(sessionId)
            .then(res => {if (res) createConnection(server, sessionId)});
    });

    return (
        <div id="app">
            <Header
                servers={connections}
                activePage={activePage}
                setActiveServer={i => setActivePage(i)}
                closeServer={removeConnection}
                showAbout={() => setActivePage("about")}
                showTips={() => setActivePage("tips")}
                showLoginForm={() => setActivePage(null)} />
            {connections.map((c, i) =>
                <EntityViewer
                    key={c.sessionId}
                    icatClient={new IcatClient(c.server, c.sessionId)}
                    visible={aServerIsActive && i === activePage} />)}
            {activePage === "about" && <About /> }
            {activePage === "tips" && <Tips /> }
            {activePage === null &&
                <ServerConnector
                    createConnection={createConnection} />}
        </div>
    );
}

export default App;
