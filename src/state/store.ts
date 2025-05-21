import {create} from "zustand/react";
import {ConnectionsSlice, createConnectionsSlice} from "./connectionsSlice";
import {createUISlice, UISlice} from "./uiSlice";
import {
    ConnectionTabsSlice,
    createConnectionTabsSlice
} from "./connectionTabsSlice";
import {CompositeSlice, createCompositeSlice} from "./compositeSlice";

type Store = ConnectionsSlice
    & UISlice
    & ConnectionTabsSlice
    & CompositeSlice;

export const useAppStore = create<Store>((...a) => ({
    ...createConnectionsSlice(...a),
    ...createUISlice(...a),
    ...createConnectionTabsSlice(...a),
    ...createCompositeSlice(...a)
}));
