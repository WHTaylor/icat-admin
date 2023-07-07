import {useEffect} from "preact/hooks";

import style from './style.css';

import IcatClient from '../../../icat';
import EntityTableView from '../view';
import {randomSuffix, range} from '../../../utils';
import {OpenRelatedHandler} from "../../context-menu";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import OnChangeInput from "../../generic/on-change-input";
import {EntityStateAction} from "../../../entityState";
import {EntityTabState, NewIcatEntity, TableFilter} from "../../../types";

type Props = {
    server: string;
    sessionId: string;
    state: EntityTabState;
    openRelated: OpenRelatedHandler;
    deleteEntities: (ids: number[]) => void;
    insertCreation: (i: number, id: number) => void;
    reloadEntity: (id: number) => Promise<void>;
    dispatch: (action: EntityStateAction) => void;
    idx: number;
}

const EntityTable = (
    {
        server,
        sessionId,
        state,
        openRelated,
        deleteEntities,
        insertCreation,
        reloadEntity,
        dispatch,
        idx
    }: Props) => {
    const icatClient = new IcatClient(server, sessionId);
    const {filter, data, deletions, creations, errMsg} = state;

    const handleFilterChange =
        f => dispatch({type: "edit_filter", idx, filter: f});
    const cancelCreations = idxs =>
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
                    qc.removeQueries([icatClient.cacheKey(filter)])
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
                openRelated={openRelated}
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
            />}
    </>);
}

type PaginationProps = {
    pageNumber: number;
    handleSetPage: (n: number) => void;
    handleLimitChange: (n: number) => void;
    handlePageChange: (n: number) => void;
}

const PaginationControl = (
    {
        pageNumber, handleSetPage, handleLimitChange, handlePageChange
    }: PaginationProps) => {
    const decPage = () => handlePageChange(-1);
    const incPage = () => handlePageChange(1);

    const suffix = randomSuffix();
    const prevId = `previousPageBtn_${suffix}`;
    const nextId = `nextPageBtn_${suffix}`;

    const focusOkForPageChange = () =>
        document.activeElement === document.body
        || document.activeElement === document.getElementById(prevId)
        || document.activeElement === document.getElementById(nextId);

    useEffect(() => {
        const changePage = (ev: KeyboardEvent) => {
            if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
            if (!focusOkForPageChange()) return;

            ev.preventDefault();
            if (ev.key === "ArrowLeft") document.getElementById(prevId)!.click();
            else document.getElementById(nextId)!.click();
        };
        document.addEventListener("keydown", changePage);
        return () => {
            document.removeEventListener("keydown", changePage);
        }
    });

    return (
        <span class={style.paginationControl}>
            <button onClick={decPage} id={prevId}>Previous</button>
            <input type="number"
                   value={pageNumber}
                   class={style.pageInput}
                   onChange={ev => handleSetPage(
                       parseInt((ev.target as HTMLInputElement).value))}/>
            <button onClick={incPage} id={nextId}>Next</button>
            <span>
                <label for="pageSizeInput">Per page:</label>
                <select name="pageSizeInput" onChange={
                    ev => handleLimitChange(Number.parseInt((ev.target as HTMLSelectElement).value))}>
                    <option value="20">20</option>
                    <option value="50" selected>50</option>
                    <option value="100">100</option>
                </select>
            </span>
        </span>
    );
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
    const key = {
        table: filter.table,
        where: filter.where
    }
    const {isSuccess, data} = useQuery({
        queryKey: ['count', key],
        queryFn: async () => await icatClient.getCount(filter)
    });

    return isSuccess
        ? <p class={style.tableTitleCount}>{data} matches</p>
        : <></>;
}

export default EntityTable;
