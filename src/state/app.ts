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
    ConnectionCloseAction;

type ConnectionCreateAction = {
    type: "create_connection",
    connectionInfo: Connection
};

type ConnectionCloseAction = {
    type: "close_connection",
    idx: number
};

type AppState = {
    connections: ConnectionState[]
}

export function appStateReducer(
    state: AppState,
    action: (ConnectionStateAction & {
        connectionIdx: number
    }) | AppStateAction
): AppState {
    switch (action.type) {
        case "create_connection": {
            const newConnection = makeNewConnectionState(action.connectionInfo);
            return {
                connections: state.connections.concat(newConnection)
            };
        }

        case "close_connection": {
            return {
                connections: state.connections.filter((_, i) => i !== action.idx)
            };
        }
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
