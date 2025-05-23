import {create, useStore} from "zustand/react";
import {createToolsSlice, ToolsSlice} from "./toolsSlice";
import {createEntityTabsSlice, EntityTabsSlice} from "./entityTabsSlice";
import {createContext, useContext} from "react";
import {Connection} from "../connectioncache";
import {ConnectionUISlice, createConnectionUISlice} from "./connectionUiSlice";

/** The page can be:
 1. The index for the open server connection
 2. The tips page
 3. The about page
 4. The login page (ServerConnector), if undefined */
type Page = number | "tips" | "about"
type AppState = {
    connections: Connection[]
    connectionStores: ReturnType<typeof createConnectionStore>[]
    activePage?: Page
}

type AppActions = {
    setActivePage: (p?: Page) => void
    createConnection: (c: Connection) => void
    removeConnection: (idx: number) => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>((set) => ({
    connections: [],
    connectionStores: [],
    activePage: undefined,
    setActivePage: (p?: Page) => set((_) => ({activePage: p})),
    createConnection: (c: Connection) => set((state) => ({
        connections: [...state.connections, c],
        connectionStores: [...state.connectionStores, createConnectionStore()],
        activePage: state.connections.length
    })),
    removeConnection: (idx: number) => set((state) => {
        // Update the active page based on what we closed:
        // - Not on a connection page? No change
        // - Closed the only open connection? Go to login form
        // - Closed connection to the left, or the active connection whilst it
        // was the last connection? Move 1 left
        const activePage = state.activePage;
        let newPage = activePage;
        if (typeof activePage !== "number") newPage = activePage;
        else if (state.connections.length === 1) newPage = undefined;
        else if (activePage > idx
            || idx === state.connections.length - 1) newPage = activePage - 1;

        return {
            connections: state.connections.filter((_, i) => i !== idx),
            connectionStores: state.connectionStores.filter((_, i) => i !== idx),
            activePage: newPage
        }
    })
}));

type ConnectionStore = EntityTabsSlice
    & ToolsSlice
    & ConnectionUISlice;
export const createConnectionStore = () => create<ConnectionStore>((...a) => ({
    ...createEntityTabsSlice(...a),
    ...createToolsSlice(...a),
    ...createConnectionUISlice(...a)
}));

export const ConnectionStoreContext =
    createContext<ReturnType<typeof createConnectionStore> | null>(null);

export const useConnectionStore = <U, >(selector: (state: ConnectionStore) => U) => {
    const storeContext = useContext(ConnectionStoreContext);
    if (!storeContext) {
        throw new Error("useConnectionStore must be used within a" +
            " ConnectionStoreContext");
    }

    return useStore(storeContext, selector);
}