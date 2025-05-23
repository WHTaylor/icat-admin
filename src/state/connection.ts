/**
 * Types and functions for the reducer which manages state for a single connection
 */
import {
    EntityTabState,
    ExistingIcatEntity,
    IcatEntity, IcatEntityValue,
    TableFilter
} from "../types";
import {difference, withReplaced} from "../utils";
import {Connection} from "../connectioncache";

export type ConnectionState = {
    connectionInfo: Connection
    entityTabs: EntityTabState[]
    activeTab?: number
};

export const makeNewConnectionState = (connectionInfo: Connection) => ({
    connectionInfo,
    entityTabs: [],
    activeTab: undefined,
})

/** Actions which affect the state of a single connection */
export type ConnectionStateAction =
    EntityTabAction |
    EntityTabEditAction

/** Actions which change the number, position, or active entity tab */
type EntityTabAction =
    EntityTabCreateAction |
    EntityTabCloseAction |
    EntityTabSwapAction

/** Actions which change the state of a single entity tab */
export type EntityDataAction =
    EntitySetDataAction |
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

/** idx is the entity tab to make the change to */
type EntityTabEditAction = { idx: number } & EntityDataAction;

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

type EntitySetDataAction = {
    type: "set_data"
    data: ExistingIcatEntity[]
}

type EntityErrorAction = {
    type: "set_error"
    message: string
}

type EntitySortAction = {
    type: "sort"
    field: string
    asc: boolean
}

type EntityEditFilterAction = {
    type: "edit_filter"
    filter: TableFilter
}

type EntityRefreshAction = {
    type: "refresh"
}

type EntityMarkDeleteAction = {
    type: "mark_delete"
    id: number
}

type EntityCancelDeleteAction = {
    type: "cancel_deletes"
    ids: number[]
}

type EntitySyncDeleteAction = {
    type: "sync_deletes"
    ids: number[]
}

type EntityAddCreationAction = {
    type: "add_creation"
}

type EntityCancelCreationsAction = {
    type: "cancel_creations"
    idxs: number[]
}

type EntityEditCreationAction = {
    type: "edit_creation"
    i: number
    k: string
    v: IcatEntityValue
}

type EntitySyncCreationAction = {
    type: "sync_creation"
    i: number
    entity: ExistingIcatEntity
}

type EntityModifyAction = {
    type: "edit_entity"
    id: number
    k: string
    v: string | number | { id: number }
}

type EntityCancelModificationsAction = {
    type: "cancel_modifications"
    id: number
}

type EntitySyncModificationAction = {
    type: "sync_modification"
    entity: ExistingIcatEntity
}

export function connectionTabReducer(
    state: ConnectionState,
    action: ConnectionStateAction
): ConnectionState {
    if (action.type == "create_tab") {
        const entities = state.entityTabs.concat({
            filter: action.filter,
            key: Math.random(),
            creations: [],
            deletions: new Set<number>(),
            showAllColumns: false
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
        else if (action.idx < state.activeTab) activeTab = state.activeTab - 1;
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
                const data = [action.entity].concat(ets.data ?? []);
                return cancelCreations({
                    ...ets,
                    data,
                }, [action.i]);
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
                // TODO: Fix this for dates - toString isn't enough
                if (originalValue === undefined && (typeof action.v === "string" && action.v.trim() === "")
                    || action.v === originalValue?.toString()
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
