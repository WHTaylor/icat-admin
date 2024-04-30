import {useLayoutEffect, useReducer} from 'preact/hooks';

import IcatClient, {isValidSession} from '../icat';
import About from './about';
import Tips from './tips';
import Header from './header';
import EntityBrowser from './entity-browser';
import ServerConnector from './server-connector';
import {
    Connection,
    getLastLogin,
    invalidateLogin,
    saveLogin
} from '../connectioncache';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {appStateReducer, Page} from "../state/app";

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
    const [state, dispatch] = useReducer(
        appStateReducer,
        {
            activePage: undefined, connections: []
        });

    const createConnection = (login: Connection) => {
        saveLogin(login);
        dispatch({
            type: "create_connection",
            connectionInfo: login
        })
    };

    const setActivePage = (p: Page) =>
        dispatch({
            type: "change_page",
            page: p
        });

    const removeConnection = (i: number) => {
        const c = state.connections[i].connectionInfo;

        invalidateLogin(c.server, c.username);
        new IcatClient(c.server, c.sessionId).logout();
        dispatch({
            type: "close_connection",
            idx: i
        });
    }

    // If not on the login page, and no servers are currently active, try to
    // login to the last active server.
    useLayoutEffect(() => {
        if (state.activePage !== undefined) return;
        if (state.connections.length > 0) return;
        const login = getLastLogin();
        if (login === null) return;
        isValidSession(login)
            .then(res => {if (res) createConnection(login)});
    });

    // es pattern matching when?
    const activePage = state.activePage === undefined
        ? <ServerConnector createConnection={createConnection}/>
        : state.activePage == "tips"
            ? <Tips/>
            : state.activePage == "about"
                ? <About/>
                : <EntityBrowser
                    server={state.connections[state.activePage].connectionInfo.server}
                    sessionId={state.connections[state.activePage].connectionInfo.sessionId}
                    visible={true}
                    entityTabs={state.connections[state.activePage].entityTabs}
                    activeTabIdx={state.connections[state.activePage].activeTab ?? undefined}
                    dispatch={a => dispatch(
                        {...a, connectionIdx: state.activePage as number}
                    )}
                    key={state.connections[state.activePage].connectionInfo.sessionId}
                />

    return (
        <QueryClientProvider client={queryClient}>
            <Header
                connections={state.connections.map(c => c.connectionInfo)}
                closeConnection={removeConnection}
                setActivePage={setActivePage}
                activePage={state.activePage}/>
            {activePage}
        </QueryClientProvider>
    );
}

export default App;
