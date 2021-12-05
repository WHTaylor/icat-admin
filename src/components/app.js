import { h } from 'preact';
import { useLayoutEffect, useEffect, useState } from "preact/hooks";

import IcatClient from '../icat.js';
import About from './about';
import Header from './header';
import EntityViewer from './entity-viewer';
import ServerConnector from './server-connector';
import {getLastLogin, saveLogin, invalidateLogin} from '../servercache.js';

const App = () => {
    const [connections, setConnections] = useState([]);
    const [activeServer, setActiveServer] = useState(null);
    const [showAbout, setShowAbout] = useState(false);

    const createConnection = (server, sessionId) => {
        const numConnections = connections.length;
        setConnections(
            connections.concat({"server": server, "sessionId": sessionId}));
        setActiveServer(numConnections);
        saveLogin(server, sessionId);
    };

    const disconnect = i => {
        const c = connections[i];
        invalidateLogin(c.server);
        new IcatClient(c.server, c.sessionId).logout();
        if (i < activeServer) {
            setActiveServer(i - 1);
        } else if (i === activeServer) {
            if (i === 0) setActiveServer(null);
            else if (i === connections.length - 1) setActiveServer(activeServer - 1);
        }
        setConnections(connections.slice(0, i).concat(connections.slice(i + 1)));
    };

    useLayoutEffect(() => {
        if (connections.length > 0) return;
        const [server, sessionId] = getLastLogin();
        if (server == null || sessionId === null) return;
        const client = new IcatClient(server);
        client.isValidSession(sessionId)
            .then(res => {if (res) createConnection(server, sessionId)});
    });

    useEffect(() => {
        const logout = ev => {
            if (ev.key === "q" && activeServer !== null) disconnect(activeServer);
        };
        document.addEventListener("keydown", logout);
        return () => document.removeEventListener("keydown", logout);
    });

    return (
        <div id="app">
            <Header
                servers={connections}
                activePage={showAbout ? "about" : activeServer}
                setActiveServer={i => {setShowAbout(false); setActiveServer(i)}}
                showAbout={() => setShowAbout(true)}
                showLoginForm={() => {setShowAbout(false); setActiveServer(null)}} />
            {connections.map((c, i) =>
                <EntityViewer
                    icatClient={new IcatClient(c.server, c.sessionId)}
                    visible={!showAbout && i === activeServer} />)}
            {showAbout
                ? <About />
                : activeServer === null &&
                <ServerConnector
                    createConnection={createConnection} />}
        </div>
    );
}

export default App;
