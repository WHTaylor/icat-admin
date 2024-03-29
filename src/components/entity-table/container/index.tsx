import style from './style.css';

import IcatClient from '../../../icat';
import EntityTableView from '../view';
import {range} from '../../../utils';
import {useQuery, useQueryClient} from "@tanstack/react-query";
import OnChangeInput from "../../generic/on-change-input";
import {EntityStateAction} from "../../../entityState";
import {
    EntityTabState,
    NewIcatEntity,
    OpenTabHandler,
    TableFilter
} from "../../../types";
import PaginationControl from "../../controls/pagination-control";

type Props = {
    icatClient: IcatClient,
    state: EntityTabState;
    openTab: OpenTabHandler,
    deleteEntities: (ids: number[]) => void;
    insertCreation: (i: number, id: number) => void;
    reloadEntity: (id: number) => Promise<void>;
    dispatch: (action: EntityStateAction) => void;
    idx: number;
}

const EntityTable = (
    {
        icatClient,
        state,
        openTab,
        deleteEntities,
        insertCreation,
        reloadEntity,
        dispatch,
        idx
    }: Props) => {
    const {filter, data, deletions, creations, errMsg} = state;

    const handleFilterChange =
        (f: TableFilter) => dispatch({type: "edit_filter", idx, filter: f});
    const cancelCreations = (idxs: number[]) =>
        dispatch({type: "cancel_creations", idxs, idx});
    const changeWhere = (w: string) => handleFilterChange({...filter, where: w});
    const changeLimit = (l: number) => handleFilterChange({...filter, limit: l});
    const changePage = (change: number) => {
        const newOffset = Math.max(0, filter.offset + (filter.limit * change));
        if (newOffset === filter.offset) return;
        handleFilterChange({...filter, offset: newOffset});
    };
    const handleSetPage = (n: number) => {
        const newOffset = Math.max(0, filter.limit * (n - 1));
        if (newOffset === filter.offset) return;
        handleFilterChange({...filter, offset: newOffset});
    };
    const pageNumber = Math.floor(filter.offset / filter.limit) + 1;
    const qc = useQueryClient();

    return (<>
        <span class={style.tableTitleBar}>
            <h2>{filter.table}</h2>
            <OnChangeInput
                type="text"
                class={style.filterInput}
                value={filter.where || ""}
                placeholder="Filter by (ie. id = 1234)"
                onChange={ev => changeWhere((ev.target as HTMLInputElement).value)}/>
            <button
                title="Refresh data"
                onClick={() => {
                    qc.removeQueries([icatClient.buildUrl(filter)])
                    dispatch({type: "refresh", idx});
                }}>
                ↻
            </button>
            <PaginationControl
                pageNumber={pageNumber}
                handleSetPage={handleSetPage}
                handleLimitChange={changeLimit}
                handlePageChange={changePage}/>
            <EntityCounter filter={filter} icatClient={icatClient}/>
        </span>

        <span class={style.tableActionsBar}>
            <CreateActions
                creations={creations}
                addCreation={() => dispatch({type: "add_creation", idx})}
                clearCreations={() => cancelCreations(range(creations.length))}/>
            <DeleteActions
                deletions={deletions}
                clearDeletions={() => dispatch({
                    type: "cancel_deletes", ids: [...deletions], idx
                })}
                deleteAll={() => deleteEntities([...deletions])}/>
        </span>

        {errMsg !== undefined
            ? <p>{errMsg}</p>
            : <EntityTableView
                data={data}
                deletions={deletions}
                creations={creations}
                modifications={state.modifications ?? {}}
                entityType={filter.table}
                sortingBy={{field: filter.sortField, asc: filter.sortAsc}}
                saveEntity={e =>
                    icatClient.writeEntity(filter.table, e)}
                reloadEntity={reloadEntity}
                deleteEntities={deleteEntities}
                cancelCreation={idx => cancelCreations([idx])}
                insertCreation={insertCreation}
                dispatch={dispatch}
                idx={idx}
                openTab={openTab}
                icatClient={icatClient}
            />}
    </>);
}

type DeleteProps = {
    deletions: Set<number>;
    clearDeletions: () => void;
    deleteAll: () => void;
}
const DeleteActions = (
    {
        deletions, clearDeletions, deleteAll
    }: DeleteProps) => {
    if (deletions.size === 0) return <></>;
    return (
        <span>
            <button onClick={deleteAll}>Delete {deletions.size} rows</button>
            <button onClick={clearDeletions}>Cancel deletions</button>
        </span>);
};

type CreateProps = {
    creations: NewIcatEntity[];
    addCreation: () => void;
    clearCreations: () => void;
}
const CreateActions = (
    {
        creations, addCreation, clearCreations
    }: CreateProps) => {
    return (
        <span>
            <button onClick={addCreation}>Add new</button>
            {creations.length > 0 &&
              <button onClick={clearCreations}>Cancel creations</button>
            }
        </span>);
};

type CounterProps = {
    filter: TableFilter,
    icatClient: IcatClient
}
const EntityCounter = ({filter, icatClient}: CounterProps) => {
    const {isSuccess, data} = useQuery({
        queryKey: [icatClient.buildCountUrl(filter)],
        queryFn: async () => await icatClient.getCount(filter)
    });

    return isSuccess
        ? <p class={style.tableTitleCount}>{data} matches</p>
        : <></>;
}

export default EntityTable;
