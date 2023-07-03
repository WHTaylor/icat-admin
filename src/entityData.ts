/**
 * Types and functions for the reducer which manages the main app state
 */
import {difference, EntityTabState, TableFilter, withReplaced} from "./utils";
import {ExistingIcatEntity, IcatEntityValue} from "./icat";

type EntityStateAction =
    EntityTabAction |
    EntityTabEditAction

// Actions which change the number or position of entity tabs
type EntityTabAction =
    EntityTabCreateAction |
    EntityTabCloseAction |
    EntityTabSwapAction

// Actions which change a property of a tab
export type EntityTabEditAction =
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
    EntitySyncModificationAction

type EntityTabCreateAction = {
    type: "create"
    filter: TableFilter
}

type EntityTabCloseAction = {
    type: "close"
    idx: number
}

type EntityTabSwapAction = {
    type: "swap"
    a: number
    b: number
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
    type: "cancel_delete"
    ids: number[]
}

type EntitySyncDeleteAction = EditAction & {
    type: "sync_delete"
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

type EntitySyncModificationAction = EditAction & {
    type: "sync_modification"
    entity: ExistingIcatEntity
}

export function entityTabReducer(
    state: EntityTabState[],
    action: EntityStateAction
): EntityTabState[] {
    switch (action.type) {
        case "create":
            return state.concat({filter: action.filter});

        case "close":
            return state.slice(0, action.idx).concat(state.slice(action.idx + 1));

        case "swap":
            const rearranged = [...state];
            const temp = rearranged[action.a];
            rearranged[action.a] = rearranged[action.b];
            rearranged[action.b] = temp;
            return rearranged;

    }

    const edit = makeEditFunction(action);
    return state.map((ets, i) => i !== action.idx
        ? ets
        : edit(ets));
}

function makeEditFunction(
    action: EntityTabEditAction)
    : (EntityTabState) => EntityTabState {
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
        case "cancel_delete": {
            return ets => {
                const deletions = ets.deletions ?? new Set();
                return {
                    ...ets, deletions: difference(deletions, action.ids)
                };
            };
        }
        case "sync_delete": {
            return ets => {
                return {
                    ...ets,
                    data: ets.data?.filter(e => !action.ids.includes(e.id)),
                    deletions: undefined
                }
            };
        }

        case "add_creation":
            return ets => ({...ets, creations: (ets.creations ?? []).concat({})});

        case "cancel_creations":
            return ets => cancelCreations(ets, action.idxs);

        case "edit_creation": {
            return ets => {
                if (ets.creations === undefined) return ets;
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

        case "sync_modification":
            return ets => ({
                ...ets,
                data: ets.data?.map(e => e.id === action.entity.id
                    ? action.entity
                    : e)
            });
    }
}

function cancelCreations(ets: EntityTabState, idxs: number[]): EntityTabState {
    if (ets.creations === undefined) return ets;
    return {
        ...ets,
        creations:
            ets.creations.filter((_, i) => !idxs.includes(i))
    };
}