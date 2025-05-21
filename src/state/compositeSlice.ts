import {StateCreator} from "zustand/vanilla";
import {Connection} from "../connectioncache";
import {ConnectionsSlice} from "./connectionsSlice";
import {ConnectionTabsSlice} from "./connectionTabsSlice";
import {UISlice} from "./uiSlice";

type CompositeState = {}

type CompositeActions = {
    removeConnection: (idx: number) => void
    createConnection: (c: Connection) => void
}

export type CompositeSlice = CompositeState & CompositeActions
type Slices = CompositeSlice & ConnectionsSlice & ConnectionTabsSlice & UISlice;

export const createCompositeSlice: StateCreator<Slices, [], [], CompositeSlice> = (set, get) => {
    return {
        removeConnection: (idx: number) => {
            set(() => ({connections: get().connections.filter((_, i) => i != idx)}));
            set(() => ({connectionTabs: get().connectionTabs.filter((_, i) => i != idx)}));

            // Update the active page based on what we closed:
            // - Not on a connection page? No change
            // - Closed the only open connection? Go to login form
            // - Closed active connection whilst it was last tab? Move 1 to left
            // - Closed connection to the left? Update active to keep same connection
            const activePage = get().activePage;
            if (typeof activePage !== "number") return;
            else if (get().connections.length === 0) get().setActivePage(undefined);
            else if (activePage >= get().connections.length) get().setActivePage(get().connections.length - 1)
            else if (idx < activePage) get().setActivePage(activePage - 1);
        },
        createConnection: (c: Connection) => {
            set(() => ({connections: [...get().connections, c]}));
            set(() => ({connectionTabs: [...get().connectionTabs, {tabs: []}]}));
        }
    }
}
