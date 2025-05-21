import {StateCreator} from "zustand/vanilla";
import {Connection} from "../connectioncache";

type ConnectionState = {
    connections: Connection[]
}

type ConnectionsActions = {
    closeConnection: (idx: number) => void
    openConnection: (c: Connection) => void
}

export type ConnectionsSlice = ConnectionState & ConnectionsActions

export const createConnectionsSlice: StateCreator<ConnectionsSlice> = (set) => {
    return {
        connections: [],
        closeConnection: (idx: number) => set((state) => ({connections: state.connections.filter((_, i) => i != idx)})),
        openConnection: (c: Connection) => set((state) => ({connections: [...state.connections, c]}))
    }
}