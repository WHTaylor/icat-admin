import {StateCreator} from "zustand/vanilla";
import {EntityTabState, TableFilter} from "../types";

type EntityTabsState = {
    tabs: EntityTabState[]
    activeTab?: number
}

type EntityTabsActions = {
    getActiveTab: () => EntityTabState | undefined
    createEntityTab: (filter: TableFilter) => void
    closeEntityTab: (idx: number) => void
    setActiveTab: (idx: number) => void
    toggleShowAllColumns: () => void
}

export type EntityTabsSlice = EntityTabsState & EntityTabsActions;

export const createEntityTabsSlice: StateCreator<EntityTabsSlice> = (set, get) => {
    const withActiveTabModified = (f: (tab: EntityTabState) => EntityTabState) => {
        const activeTab = get().activeTab;
        if (activeTab === undefined) return get().tabs;
        const modified = [...get().tabs];
        modified[activeTab] = f(modified[activeTab]);
        return modified;
    }

    return {
        tabs: [],
        activeTab: undefined,
        getActiveTab: () => {
            const activeTab = get().activeTab;
            if (activeTab === undefined) return undefined;
            return get().tabs[activeTab]
        },
        createEntityTab: (filter: TableFilter) => {
            const newTab = {
                filter,
                key: Math.random(),
                creations: [],
                deletions: new Set<number>(),
                showAllColumns: false
            };

            set((state) => ({
                tabs: [...state.tabs, newTab],
                activeTab: state.tabs.length
            }));
        },
        closeEntityTab: (idx: number) => {
            // If we're closing the last open tab, a tab to the left of
            // the active tab, or the active tab, the active tab needs
            // to change
            const activeTab = get().activeTab;
            let newActiveTab = get().activeTab;
            if (activeTab == undefined || get().tabs.length == 1) newActiveTab = undefined;
            else if (activeTab > idx
                || idx === get().tabs.length - 1) newActiveTab = activeTab - 1;

            set((state) => ({
                tabs: [
                    ...state.tabs.slice(0, idx),
                    ...state.tabs.slice(idx, -1)
                ],
                activeTab: newActiveTab
            }));
        },
        setActiveTab: (idx: number) => set(() => ({
            activeTab: idx
        })),
        toggleShowAllColumns: () => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                showAllColumns: !ets.showAllColumns
            }))
        }))
    }
}
