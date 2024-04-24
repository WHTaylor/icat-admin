/**
 * Types and functions for the reducer which manages the main app state
 */
import {difference, withReplaced} from "./utils";
import {EntityTabState, ExistingIcatEntity, IcatEntity, IcatEntityValue, TableFilter} from "./types";
import {Connection} from "./connectioncache";

export type EntityStateAction =
    EntityTabAction |
    EntityTabEditAction

// Actions which change the number, position, or active entity tab
type EntityTabAction =
    EntityTabCreateAction |
    EntityTabCloseAction |
    EntityTabSwapAction |
    EntityTabChangeAction

// Actions which change a property of a tab
type EntityTabEditAction =
    EntityDataAction |
    EntityErrorAction |
    EntitySortAction |
    EntityEditFilterAction |
    EntityRefreshAction |
    EntityMarkDeleteAction |
    EntityCancelDeleteAction |
    EntitySyncDeleteAction |
    EntityAddCreationAction |
    EntityCancelCreationsAction |
    EntityEditCreationAction |
    EntitySyncCreationAction |
    EntityModifyAction |
    EntityCancelModificationsAction |
    EntitySyncModificationAction

type EntityTabCreateAction = {
    type: "create_tab"
    filter: TableFilter
}

type EntityTabCloseAction = {
    type: "close_tab"
    idx: number
}

type EntityTabSwapAction = {
    type: "swap"
    a: number
    b: number
}

type EntityTabChangeAction = {
    type: "change_tab"
    idx: number
}

type EditAction = {
    idx: number
}

type EntityDataAction = EditAction & {
    type: "set_data"
    data: ExistingIcatEntity[]
}

type EntityErrorAction = EditAction & {
    type: "set_error"
    message: string
}

type EntitySortAction = EditAction & {
    type: "sort"
    field: string
    asc: boolean
}

type EntityEditFilterAction = EditAction & {
    type: "edit_filter"
    filter: TableFilter
}

type EntityRefreshAction = EditAction & {
    type: "refresh"
}

type EntityMarkDeleteAction = EditAction & {
    type: "mark_delete"
    id: number
}

type EntityCancelDeleteAction = EditAction & {
    type: "cancel_deletes"
    ids: number[]
}

type EntitySyncDeleteAction = EditAction & {
    type: "sync_deletes"
    ids: number[]
}

type EntityAddCreationAction = EditAction & {
    type: "add_creation"
}

type EntityCancelCreationsAction = EditAction & {
    type: "cancel_creations"
    idxs: number[]
}

type EntityEditCreationAction = EditAction & {
    type: "edit_creation"
    i: number
    k: string
    v: IcatEntityValue
}

type EntitySyncCreationAction = EditAction & {
    type: "sync_creation"
    i: number
    entity: ExistingIcatEntity
}

type EntityModifyAction = EditAction & {
    type: "edit_entity"
    id: number
    k: string
    v: string | number | { id: number }
}

type EntityCancelModificationsAction = EditAction & {
    type: "cancel_modifications"
    id: number
}

type EntitySyncModificationAction = EditAction & {
    type: "sync_modification"
    entity: ExistingIcatEntity
}

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

type ConnectionState = {
    entityTabs: EntityTabState[]
    activeTab?: number
    connectionInfo: Connection
};

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

export function appStateReducer(
    state: AppState,
    action: (EntityStateAction & {
        connectionIdx: number
    }) | AppStateAction
): AppState {
    switch (action.type) {
        case "create_connection":
            return {
                activePage: state.connections.length,
                connections: state.connections.concat({
                    entityTabs: [],
                    connectionInfo: action.connectionInfo
                })
            };
        case "close_connection":
            const c = state.activePage;
            let newActivePage = undefined;
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

        case "change_page":
            return {...state, activePage: action.page};
    }

    const connectionState = state.connections[action.connectionIdx];
    const newConnectionState = connectionTabReducer(connectionState, action);
    const connections = withReplaced(
        state.connections, newConnectionState, action.connectionIdx);
    return {
        ...state,
        connections
    };
}

function connectionTabReducer(
    state: ConnectionState,
    action: EntityStateAction
): ConnectionState {
    if (action.type == "change_tab") {
        return {...state, activeTab: action.idx};
    } else if (action.type == "create_tab") {
        const entities = state.entityTabs.concat({
            filter: action.filter,
            key: Math.random(),
            creations: [],
            deletions: new Set<number>()
        });
        return {
            ...state,
            activeTab: entities.length - 1,
            entityTabs: entities
        };
    } else if (action.type == "close_tab") {
        const entities = state.entityTabs
            .slice(0, action.idx)
            .concat(state.entityTabs
                .slice(action.idx + 1));
        let activeTab = state.activeTab;
        if (entities.length === 0 || state.activeTab === undefined) activeTab = undefined;
        else if (state.activeTab < action.idx) activeTab = state.activeTab - 1;
        else if (state.activeTab === action.idx) activeTab = Math.min(entities.length - 1, state.activeTab);

        return {
            ...state,
            activeTab,
            entityTabs: entities
        };
    } else if (action.type == "swap") {
        const rearranged = [...state.entityTabs];
        const temp = rearranged[action.a];
        rearranged[action.a] = rearranged[action.b];
        rearranged[action.b] = temp;
        const activeTab = state.activeTab === action.a
            ? action.b
            : state.activeTab === action.b
                ? action.a
                : state.activeTab;
        return {
            ...state,
            activeTab,
            entityTabs: rearranged
        };
    }

    const edit = makeEditFunction(action);
    const newEntities = state.entityTabs.map((ets, i) => i !== action.idx
        ? ets
        : edit(ets));
    return {
        ...state,
        entityTabs: newEntities
    };
}

function makeEditFunction(action: EntityTabEditAction)
    : (entityTabState: EntityTabState) => EntityTabState {
    switch (action.type) {
        case "set_data":
            return ets => ({...ets, data: action.data, errMsg: undefined});
        case "set_error":
            return ets => ({...ets, errMsg: action.message, data: undefined});
        case "edit_filter":
            return ets => ({
                ...ets,
                filter: action.filter,
                data: undefined,
                errMsg: undefined
            });
        case "sort": {
            return ets => {
                const old = ets.filter;
                // If sort uses a new field or direction, sort by that.
                // Otherwise, stop sorting
                const filter = old.sortField !== action.field || old.sortAsc !== action.asc
                    ? {...old, sortField: action.field, sortAsc: action.asc}
                    : {...old, sortField: null};
                return {...ets, filter, data: undefined, errMsg: undefined}
            }
        }
        case "refresh":
            return ets => ({...ets, data: undefined, errMsg: undefined})

        case "mark_delete": {
            return ets => {
                const deletions = ets.deletions ?? new Set();
                deletions.add(action.id);
                return {...ets, deletions};
            };
        }
        case "cancel_deletes": {
            return ets => {
                const deletions = ets.deletions ?? new Set();
                return {
                    ...ets, deletions: difference(deletions, action.ids)
                };
            };
        }
        case "sync_deletes": {
            return ets => {
                return {
                    ...ets,
                    data: ets.data?.filter(e => !action.ids.includes(e.id)),
                    deletions: new Set()
                }
            };
        }

        case "add_creation":
            return ets => ({...ets, creations: (ets.creations ?? []).concat({})});

        case "cancel_creations":
            return ets => cancelCreations(ets, action.idxs);

        case "edit_creation": {
            return ets => {
                if (ets.creations.length === 0) return ets;
                const edited = {
                    ...(ets.creations[action.i]),
                    [action.k]: action.v
                }
                return {
                    ...ets,
                    creations: withReplaced(
                        ets.creations, edited, action.i)
                };
            }
        }

        case "sync_creation": {
            return ets => {
                const data = (ets.data ?? []).concat(action.entity);
                return cancelCreations({
                    ...ets,
                    data,
                }, [action.idx]);
            }
        }

        case "edit_entity": {
            return (ets: EntityTabState) => {
                const entityModifications = (ets.modifications ?? {})[action.id] ?? {};
                const originalValue = ets.data!.find(e => e.id === action.id)![action.k];
                const edited = {
                    ...entityModifications,
                    [action.k]: action.v
                };

                // If we've modified the value back to the original, remove the modification
                if (action.v === originalValue
                    || (typeof originalValue === "object" && !Array.isArray(originalValue))
                    && originalValue.id === (action.v as IcatEntity).id) {
                    delete edited[action.k];
                }

                // If all values have been reverted back to the originals, remove modifications
                const modifications = {
                    ...(ets.modifications ?? {}),
                    [action.id]: edited
                }

                if (Object.keys(edited).length === 0) {
                    delete modifications[action.id];
                }
                return {...ets, modifications};
            };
        }

        case "cancel_modifications":
            return ets => cancelModifications(ets, action.id);

        case "sync_modification":
            return ets => cancelModifications({
                ...ets,
                data: ets.data?.map(e => e.id === action.entity.id
                    ? action.entity
                    : e)
            }, action.entity.id);
    }
}

function cancelModifications(ets: EntityTabState, id: number): EntityTabState {
    if (ets.modifications === undefined) return ets;
    const modifications = {...ets.modifications};
    delete modifications[id];
    return {...ets, modifications};
}

function cancelCreations(ets: EntityTabState, idxs: number[]): EntityTabState {
    return {
        ...ets,
        creations:
            ets.creations.filter((_, i) => !idxs.includes(i))
    };
}
