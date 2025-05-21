import {useLayoutEffect, useReducer} from 'preact/hooks';

import IcatClient, {isValidSession} from '../icat';
import About from './about';
import Tips from './tips';
import Header from './header';
import LoginForm from './login-form';
import {
    Connection,
    getLastLogin,
    invalidateLogin,
    saveLogin
} from '../connectioncache';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {appStateReducer} from "../state/app";
import ServerConnection from "./server-connection";
import {useAppStore} from "../state/store";

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
    const store = useAppStore((state) => state);

    const [state, dispatch] = useReducer(
        appStateReducer,
        {
            connections: []
        });

    const createConnection = (login: Connection) => {
        saveLogin(login);
        store.openConnection(login);
        store.setActivePage(store.connections.length)
        dispatch({
            type: "create_connection",
            connectionInfo: login
        });
    };

    const removeConnection = async (i: number) => {
        const c = store.connections[i];

        invalidateLogin(c.server, c.username);
        await new IcatClient(c.server, c.sessionId).logout();
        store.closeConnection(i);
        dispatch({
            type: "close_connection",
            idx: i
        });

        // Update the active page based on what we closed:
        // - Not on a connection page? No change
        // - Closed the only open connection? Go to login form
        // - Closed connection to the left? Update active to keep same connection
        // - Closed active connection whilst it was last tab? Move 1 to left
        if (typeof store.activePage !== "number") return;
        else if (store.connections.length === 1) store.setActivePage(undefined);
        else if (i < store.activePage || i === store.connections.length - 1)
            store.setActivePage(store.activePage - 1);
    }

    // If on the login page, and no servers are currently active, try to
    // login to the last active server.
    useLayoutEffect(() => {
        if (store.activePage !== undefined) return;
        if (store.connections.length > 0) return;
        const login = getLastLogin();
        if (login === null || login.sessionId == undefined) return;
        isValidSession(login)
            .then(res => {if (res) createConnection(login)});
    });

    // es pattern matching when?
    const activePage = store.activePage === undefined
        ? <LoginForm createConnection={createConnection}/>
        : store.activePage == "tips"
            ? <Tips/>
            : store.activePage == "about"
                ? <About/>
                : <ServerConnection
                    connection={{
                        ...state.connections[store.activePage],
                        connectionInfo: store.connections[store.activePage]
                    }}
                    dispatch={a => dispatch({
                        ...a, connectionIdx: store.activePage as number
                    })}
                />

    return (
        <QueryClientProvider client={queryClient}>
            <Header closeConnection={removeConnection}/>
            {activePage}
        </QueryClientProvider>
    );
}

export default App;
