import {StateCreator} from "zustand/vanilla";
import {EntityTabState, TableFilter} from "../types";
import {UISlice} from "./uiSlice";

type ConnectionTabs = {
    tabs: EntityTabState[]
    activeTab?: number
}

type ConnectionTabsState = {
    connectionTabs: ConnectionTabs[]
    getActiveConnectionTabs: () => ConnectionTabs | undefined
}

type ConnectionTabsActions = {
    createEntityTab: (filter: TableFilter) => void
    closeEntityTab: (idx: number) => void
    setActiveTab: (idx: number) => void
}

export type ConnectionTabsSlice = ConnectionTabsState & ConnectionTabsActions;

export const createConnectionTabsSlice: StateCreator<
    ConnectionTabsSlice & UISlice, [], [], ConnectionTabsSlice> = (set, get) => {
    function withActiveConnectionModified(f: (c: ConnectionTabs) => ConnectionTabs) {
        const activePage = get().activePage;
        if (typeof activePage !== "number") return get().connectionTabs;
        const modified = [...get().connectionTabs];
        modified[activePage] = f(modified[activePage]);
        return modified;
    }

    return {
        connectionTabs: [],
        getActiveConnectionTabs: () => typeof get().activePage !== "number"
            ? undefined
            : get().connectionTabs[get().activePage as number],
        createEntityTab: (filter: TableFilter) => {
            const newTab = {
                filter,
                key: Math.random(),
                creations: [],
                deletions: new Set<number>(),
                showAllColumns: false
            };

            set(() => ({
                connectionTabs: withActiveConnectionModified(c => ({
                    tabs: [...c.tabs, newTab],
                    activeTab: c.tabs.length
                }))
            }));
        },
        closeEntityTab: (idx: number) => {
            set(() => ({
                connectionTabs: withActiveConnectionModified(c => {
                    // If we're closing the last open tab, a tab to the left of
                    // the active tab, or the active tab, the active tab needs
                    // to change
                    let newActiveTab = c.activeTab;
                    if (c.activeTab == undefined || c.tabs.length == 1) newActiveTab = undefined;
                    else if (c.activeTab > idx) newActiveTab = c.activeTab - 1;
                    else if (c.activeTab === idx) newActiveTab = Math.min(c.activeTab, c.tabs.length - 2);

                    return {
                        tabs: [
                            ...c.tabs.slice(0, idx),
                            ...c.tabs.slice(idx, -1)
                        ],
                        activeTab: newActiveTab
                    };
                })
            }))
        },
        setActiveTab: (idx: number) => set(() => ({
            connectionTabs: withActiveConnectionModified(c => ({
                tabs: c.tabs,
                activeTab: idx
            }))
        })),
    }
}
