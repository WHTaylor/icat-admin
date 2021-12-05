import { h } from 'preact';
import { useLayoutEffect, useEffect, useState } from "preact/hooks";

import IcatClient from '../icat.js';
import Header from './header';
import EntityViewer from './entity-viewer';
import ServerConnector from './server-connector';

const App = () => {
    const [connections, setConnections] = useState([]);
    const [activeServer, setActiveServer] = useState(null);

    const createConnection = (server, sessionId) => {
        const numConnections = connections.length;
        setConnections(
            connections.concat({"server": server, "sessionId": sessionId}));
        setActiveServer(numConnections);
    };

    const disconnect = i => {
        setConnections(connections.slice(0, i).concat(connections.slice(i + 1)));
    };

    return (
        <div id="app">
            <Header
                servers={connections.map(c => c.server)}
                activeServer={activeServer}
                setActiveServer={setActiveServer}
                showLoginForm={() => setActiveServer(null)} />
            {connections.map((c, i) =>
                <EntityViewer
                    path="/"
                    icatClient={new IcatClient(c.server, c.sessionId)}
                    visible={i === activeServer} />)}
            {activeServer === null &&
                <ServerConnector
                    path="/"
                    createConnection={createConnection} />}
        </div>
    );
}

export default App;
