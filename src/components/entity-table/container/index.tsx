import style from './style.module.css';

import IcatClient from '../../../icat';
import EntityTableView from '../view';
import {range} from '../../../utils';
import {useQuery, useQueryClient} from "@tanstack/react-query";
import OnChangeInput from "../../generic/on-change-input";
import {EntityDataAction} from "../../../state/connection";
import {EntityTabState, NewIcatEntity, OpenTabHandler, TableFilter} from "../../../types";
import PaginationControl from "../../controls/pagination-control";
import {useConnectionStore} from "../../../state/stores";

type Props = {
    icatClient: IcatClient,
    state: EntityTabState;
    openTab: OpenTabHandler,
    deleteEntities: (ids: number[]) => void;
    insertCreation: (i: number, id: number) => Promise<void>;
    reloadEntity: (id: number) => Promise<void>;
    dispatch: (action: EntityDataAction) => void;
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
    }: Props) => {
    const {filter, data, deletions, creations, errMsg} = state;
    const activeTab = useConnectionStore((state) => state.getActiveTab());
    const showAllColumns = activeTab?.showAllColumns || false;
    const toggleShowAllColumns = useConnectionStore((state) => state.toggleShowAllColumns);

    const handleFilterChange =
        (f: TableFilter) => dispatch({type: "edit_filter", filter: f});
    const cancelCreations = (idxs: number[]) =>
        dispatch({type: "cancel_creations", idxs});
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
                    qc.removeQueries({queryKey: [icatClient, filter]})
                    dispatch({type: "refresh"});
                }}>
                ↻
            </button>
            <PaginationControl
                pageNumber={pageNumber}
                handleSetPage={handleSetPage}
                handleLimitChange={changeLimit}
                handlePageChange={changePage}/>
            <label>
                {/*
                   The label not matching the action/state name here is
                   intentional; from a users point of view, the action is to
                   see all of the columns, but internally the difference is
                   whether we show the empty columns or not
                */}
                Show empty columns
                <input
                    type="checkbox"
                    checked={showAllColumns}
                    defaultChecked={showAllColumns}
                    onChange={toggleShowAllColumns}
                />
            </label>
            <EntityCounter filter={filter} icatClient={icatClient}/>
        </span>

        <span class={style.tableActionsBar}>
            <CreateActions
                creations={creations}
                addCreation={() => dispatch({type: "add_creation"})}
                clearCreations={() => cancelCreations(range(creations.length))}/>
            <DeleteActions
                deletions={deletions}
                clearDeletions={() => dispatch({
                    type: "cancel_deletes", ids: [...deletions]
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
                openTab={openTab}
                icatClient={icatClient}
                showAllColumns={showAllColumns}
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
        queryKey: [icatClient, filter, 'count'],
        queryFn: async ({signal}) => await icatClient.getCount(filter, signal)
    });

    return isSuccess
        ? <p class={style.tableTitleCount}>{data} matches</p>
        : <></>;
}

export default EntityTable;
