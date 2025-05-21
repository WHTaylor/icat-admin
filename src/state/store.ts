import {create} from "zustand/react";
import {ConnectionsSlice, createConnectionsSlice} from "./connectionsSlice";
import {createUISlice, UISlice} from "./uiSlice";

type Store =ConnectionsSlice
    & UISlice;

export const useAppStore = create<Store>((...a) => ({
    ...createConnectionsSlice(...a),
    ...createUISlice(...a)
}));