/**
 * Types and functions for the reducer which manages the main app state
 */
import {withReplaced} from "../utils";
import {Connection} from "../connectioncache";
import {
    ConnectionState,
    ConnectionStateAction,
    connectionTabReducer, makeNewConnectionState
} from "./connection";

/** Actions which affect top level app state */
type AppStateAction =
    ConnectionCreateAction |
    ConnectionCloseAction |
    PageChangeAction;

type ConnectionCreateAction = {
    type: "create_connection",
    connectionInfo: Connection
};

type ConnectionCloseAction = {
    type: "close_connection",
    idx: number
};

type PageChangeAction = {
    type: "change_page",
    page: Page
};

/** The page can be:
 1. The index for the open server connection
 2. The tips page
 3. The about page
 4. The login page (ServerConnector), if undefined */
export type Page = number | "tips" | "about" | undefined
type AppState = {
    connections: ConnectionState[]
    activePage: Page
}

export function appStateReducer(
    state: AppState,
    action: (ConnectionStateAction & {
        connectionIdx: number
    }) | AppStateAction
): AppState {
    switch (action.type) {
        case "create_connection":
            const newConnection = makeNewConnectionState(action.connectionInfo);
            return {
                activePage: state.connections.length,
                connections: state.connections.concat(newConnection)
            };
        case "close_connection": {
            const c = state.activePage;
            let newActivePage;
            if (typeof c !== "number") newActivePage = c;
            else if (state.connections.length == 1) newActivePage = undefined;
            else if (action.idx < c
                || action.idx === state.connections.length - 1) newActivePage = c - 1;

            const newConnections = state.connections
                .slice(0, action.idx)
                .concat(state.connections
                    .slice(action.idx + 1));

            return {
                activePage: newActivePage, connections: newConnections
            };
        }

        case "change_page":
            return {...state, activePage: action.page};
    }

    // Handle actions which affect a single connection
    const connectionState = state.connections[action.connectionIdx];
    const newConnectionState = connectionTabReducer(connectionState, action);
    const connections = withReplaced(
        state.connections, newConnectionState, action.connectionIdx);
    return {
        ...state,
        connections
    };
}
