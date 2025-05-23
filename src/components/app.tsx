import {useLayoutEffect} from 'preact/hooks';

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
import ServerConnection from "./server-connection";
import {ConnectionStoreContext, useAppStore} from "../state/stores";

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

    const createConnection = (login: Connection) => {
        saveLogin(login);
        store.createConnection(login);
    };

    const removeConnection = async (idx: number) => {
        const c = store.connections[idx];
        invalidateLogin(c.server, c.username);
        await new IcatClient(c.server, c.sessionId).logout();
        store.removeConnection(idx);
    }

    // If on the login page, and no servers are currently active, try to
    // login to the last active server.
    useLayoutEffect(() => {
        if (store.activePage !== undefined) return;
        if (store.connections.length > 0) return;
        const login = getLastLogin();
        if (login === null || login.sessionId == undefined) return;
        isValidSession(login)
            .then(res => {
                if (res) createConnection(login)
            });
    });

    // es pattern matching when?
    const activePage = store.activePage === undefined
        ? <LoginForm createConnection={createConnection}/>
        : store.activePage == "tips"
            ? <Tips/>
            : store.activePage == "about"
                ? <About/>
                : <ConnectionStoreContext
                    value={store.connectionStores[store.activePage]}>
                    <ServerConnection
                        connection={store.connections[store.activePage]}
                    />
                </ConnectionStoreContext>

    return (
        <QueryClientProvider client={queryClient}>
            <Header closeConnection={removeConnection}/>
            {activePage}
        </QueryClientProvider>
    );
}

export default App;
