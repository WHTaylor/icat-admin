import {h, Fragment, FunctionComponent} from 'preact';
import { useLayoutEffect, useState } from 'preact/hooks';
import {Router, route, Route} from 'preact-router';

import IcatClient, {isValidSession} from '../icat';
import About from './about';
import Tips from './tips';
import Header from './header';
import EntityViewer from './entity-viewer';
import ServerConnector from './server-connector';
import {getLastLogin, saveLogin, invalidateLogin, Connection} from '../connectioncache';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchInterval: false,
            refetchOnWindowFocus: false,
        }
    }
});

const App = () => {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [activeConnection, setActiveConnection] =
        useState<number | null>(null);

    const createConnection = (login: Connection) => {
        saveLogin(login);
        setActiveConnection(connections.length);
        setConnections(connections.concat(login));
        route("/icat");
    };

    const removeConnection = (i: number) => {
        const numConnections = connections.length;
        const c = connections[i];

        invalidateLogin(c.server, c.username);
        new IcatClient(c.server, c.sessionId).logout();
        setConnections(connections.slice(0, i).concat(connections.slice(i + 1)));

        // Don't change active tab if non-connection tab is selected
        if (activeConnection === null) return;

        // Go to login screen if last connection was closed
        if (numConnections === 1) route("/");

        // If we closed a connection to the left, or the last connection whilst
        //it was active, decrement the active connection
        if (i < activeConnection
            || (activeConnection == numConnections - 1) && i === activeConnection) {
            setActiveConnection(activeConnection - 1);
        }
    }

    // If on the home or icat page, and no servers are currently active, try to
    // login to the last active server.
    useLayoutEffect(() => {
        if (location.pathname != "/" && location.pathname != "/icat") return;
        if (connections.length > 0) return;
        const login = getLastLogin();
        if (login === null) return;
        isValidSession(login)
            .then(res => {if (res) createConnection(login)});
    });

    return (
        <QueryClientProvider client={queryClient}>
            <Header
                connections={connections}
                closeConnection={removeConnection}
                setActiveConnection={i => { route("/icat"); setActiveConnection(i)}}
                activeConnection={activeConnection} />

            <Router onChange={
                e => {
                    if (e.path != "/icat") setActiveConnection(null);
                }
            }>
                <Route path="/tips" component={Tips}/>
                <Route path="/about" component={About}/>
                <Route path="/icat" component={Nothing}/>
                <Route path="/" component={ServerConnector} createConnection={createConnection} />
            </Router>

            {connections.map((c, i) =>
                <EntityViewer
                    key={c.sessionId}
                    server={c.server}
                    sessionId={c.sessionId}
                    visible={i === activeConnection} />) }
        </QueryClientProvider>
    );
}

const Nothing: FunctionComponent = () => null;

export default App;
