import {StateCreator} from "zustand/vanilla";
import {Connection} from "../connectioncache";

type ConnectionState = {
    connections: Connection[]
}

type ConnectionsActions = {
}

export type ConnectionsSlice = ConnectionState & ConnectionsActions

export const createConnectionsSlice: StateCreator<ConnectionsSlice> = () => {
    return {
        connections: [],
    }
}