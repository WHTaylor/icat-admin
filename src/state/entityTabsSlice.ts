import {StateCreator} from "zustand/vanilla";
import {
    EntityTabState,
    ExistingIcatEntity, IcatEntity,
    IcatEntityValue,
    TableFilter
} from "../types";
import {difference, withReplaced} from "../utils";

type EntityTabsState = {
    tabs: EntityTabState[]
    activeTab?: number
}

type EntityTabsActions = {
    getActiveTab: () => EntityTabState | undefined
    createEntityTab: (filter: TableFilter) => void
    closeEntityTab: (idx: number) => void
    setActiveTab: (idx: number) => void
    swapTabs: (a: number, b: number) => void

    setTabData: (data: ExistingIcatEntity[], idx: number) => void
    setTabError: (errMsg: string, idx: number) => void
    refresh: () => void

    setFilter: (filter: TableFilter) => void
    toggleShowAllColumns: () => void
    setSortingBy: (field: string, asc: boolean) => void

    addCreation: () => void
    cancelCreations: (idxs: number[]) => void
    editCreation: (idx: number, k: string, v: IcatEntityValue) => void
    syncCreation: (idx: number, e: ExistingIcatEntity) => void

    markToDelete: (idx: number) => void
    cancelDeletions: (ids: number[]) => void
    syncDeletions: (ids: number[]) => void

    cancelModifications: (id: number) => void
    syncModifications: (entity: ExistingIcatEntity) => void
    editEntity: (id: number, k: string, v: string | number | { id: number }) => void
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
                    ...state.tabs.slice(idx + 1)
                ],
                activeTab: newActiveTab
            }));
        },
        setActiveTab: (idx: number) => set(() => ({
            activeTab: idx
        })),
        swapTabs: (a: number, b: number) => {
            if (a === b) return;
            set((state) => {
                const rearranged = [...state.tabs];
                const temp = rearranged[a];
                rearranged[a] = rearranged[b];
                rearranged[b] = temp;
                const activeTab = state.activeTab === a
                    ? b
                    : state.activeTab === b
                        ? a
                        : state.activeTab;
                return {
                    tabs: rearranged,
                    activeTab
                }
            });
        },
        setTabData: (data: ExistingIcatEntity[], idx: number) => set((state) => ({
            tabs: withReplaced(
                state.tabs,
                {
                    ...state.tabs[idx],
                    data
                },
                idx)
        })),
        setTabError: (errMsg: string, idx: number) => set((state) => ({
            tabs: withReplaced(
                state.tabs,
                {
                    ...state.tabs[idx],
                    errMsg
                },
                idx)
        })),
        refresh: () => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                data: undefined,
                errMsg: undefined
            }))
        })),
        setFilter: (filter: TableFilter) => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                data: undefined,
                errMsg: undefined,
                filter
            }))
        })),
        toggleShowAllColumns: () => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                showAllColumns: !ets.showAllColumns
            }))
        })),
        setSortingBy: (field: string | null, asc: boolean) => set(() => ({
            tabs: withActiveTabModified(ets => {
                const previousField = ets.filter.sortField;
                const previousAsc = ets.filter.sortAsc;
                // If the same sort is set, stop sorting
                const unchanged = field === previousField && asc === previousAsc;
                const newFilter = {
                    ...ets.filter,
                    sortField: unchanged ? null : field,
                    sortAsc: asc
                };
                return {
                    ...ets,
                    filter: newFilter,
                    data: undefined,
                    errMsg: undefined
                };
            })
        })),
        addCreation: () => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                creations: ets.creations.concat({})
            }))
        })),
        cancelCreations: (idxs) => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                creations: ets.creations.filter((_, i) => !idxs.includes(i))
            }))
        })),
        editCreation: (idx, k, v) => set(() => ({
            tabs: withActiveTabModified(ets => {
                if (ets.creations.length <= idx) return ets;
                const edited = {
                    ...ets.creations[idx],
                    [k]: v
                };
                return {
                    ...ets,
                    creations: withReplaced(ets.creations, edited, idx)
                }
            })
        })),
        syncCreation: (idx, e) => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                data: [e].concat(ets.data ?? []),
                creations: ets.creations.filter((_, i) => i !== idx)
            }))
        })),
        markToDelete: (idx) => set(() => ({
            tabs: withActiveTabModified(ets => {
                const deletions = ets.deletions ?? new Set();
                deletions.add(idx);
                return {
                    ...ets,
                    deletions
                }
            })
        })),
        cancelDeletions: (ids) => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                deletions: difference(ets.deletions, ids)
            }))
        })),
        syncDeletions: (ids) => set(() => ({
            tabs: withActiveTabModified(ets => ({
                ...ets,
                deletions: difference(ets.deletions, ids),
                data: ets.data?.filter(e => !ids.includes(e.id))
            }))
        })),
        cancelModifications: (id) => set(() => ({
            tabs: withActiveTabModified(ets => cancelModifications(ets, id))
        })),
        syncModifications: (entity) => set(() => ({
            tabs: withActiveTabModified(ets => cancelModifications({
                ...ets,
                data: ets.data?.map(e => e.id === entity.id
                    ? entity
                    : e)
            }, entity.id))
        })),
        editEntity: (id, k, v) => set(() => ({
            tabs: withActiveTabModified(ets => {
                const entityModifications = (ets.modifications ?? {})[id] ?? {};
                const originalValue = ets.data!.find(e => e.id === id)![k];
                const edited = {
                    ...entityModifications,
                    [k]: v
                };

                // If we've modified the value back to the original, remove the modification
                // TODO: Fix this for dates - toString isn't enough
                if (originalValue === undefined && (typeof v === "string" && v.trim() === "")
                    || v === originalValue?.toString()
                    || (typeof originalValue === "object" && !Array.isArray(originalValue))
                    && originalValue.id === (v as IcatEntity).id) {
                    delete edited[k];
                }

                // If all values have been reverted back to the originals, remove modifications
                const modifications = {
                    ...(ets.modifications ?? {}),
                    [id]: edited
                }

                if (Object.keys(edited).length === 0) {
                    delete modifications[id];
                }
                return {
                    ...ets,
                    modifications
                }
            })
        })),
    }
}

function cancelModifications(ets: EntityTabState, id: number): EntityTabState {
    if (ets.modifications === undefined) return ets;
    const modifications = {...ets.modifications};
    delete modifications[id];
    return {...ets, modifications};
}
