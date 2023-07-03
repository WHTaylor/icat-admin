import {useEffect, useState} from "preact/hooks";
import {h, Fragment} from "preact";

import style from './style.css';

import IcatClient, {
    NewIcatEntity,
    IcatEntityValue,
} from '../../../icat';
import EntityTableView from '../view';
import {randomSuffix, TableFilter, EntityTabState, range} from '../../../utils';
import {OpenRelatedHandler} from "../../context-menu";

type Props = {
    server: string;
    sessionId: string;
    state: EntityTabState;
    handleFilterChange: (filter: TableFilter) => void;
    openRelated: OpenRelatedHandler;
    setSortingBy: (field: string, asc: boolean) => void;
    refreshData: () => void;
    markToDelete: (idx: number) => void;
    cancelDeletions: (idxs: number[]) => void;
    deleteEntities: (ids: number[]) => void;
    addCreation: () => void;
    editCreation: (i: number, k: string, v: IcatEntityValue) => void;
    cancelCreations: (idxs: number[]) => void;
    insertCreation: (i: number, id: number) => void;
    reloadEntity: (id: number) => Promise<void>;
}

const EntityTable = (
    {
        server,
        sessionId,
        state,
        handleFilterChange,
        openRelated,
        setSortingBy,
        refreshData,
        markToDelete,
        cancelDeletions,
        deleteEntities,
        addCreation,
        editCreation,
        cancelCreations,
        insertCreation,
        reloadEntity
    }: Props) => {
    const icatClient = new IcatClient(server, sessionId);
    // TODO: these slightly weird coercions are maintaining compatibility from
    //       before lifting this state up from here to EntityViewer. Sort them out
    const filter = state.filter;
    const data = state.data ?? null;
    const deletions = state.deletions ?? new Set();
    const creations = state.creations ?? [];
    const errMsg = state.errMsg ?? null;

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

    const clearDeletions = () => cancelDeletions([...deletions]);

    return (<>
        <span class={style.tableTitleBar}>
            <h2>{filter.table}</h2>
            <input
                type="text"
                class={style.filterInput}
                value={filter.where || ""}
                placeholder="Filter by (ie. id = 1234)"
                onChange={ev => changeWhere((ev.target as HTMLInputElement).value)}/>
            <button title="Refresh data" onClick={refreshData}>↻</button>
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
                addCreation={addCreation}
                clearCreations={() => cancelCreations(range(creations.length))}/>
            <DeleteActions
                deletions={deletions}
                clearDeletions={clearDeletions}
                deleteAll={() => deleteEntities([...deletions])}/>
        </span>

        {errMsg
            ? <p>{errMsg}</p>
            : <EntityTableView
                data={data}
                entityType={filter.table}
                sortingBy={{field: filter.sortField, asc: filter.sortAsc}}
                deletions={deletions}
                creations={creations}
                openRelated={openRelated}
                setSortingBy={setSortingBy}
                saveEntity={e =>
                    icatClient.writeEntity(filter.table, e)}
                reloadEntity={reloadEntity}
                markToDelete={markToDelete}
                cancelDeletion={id => cancelDeletions([id])}
                deleteEntities={deleteEntities}
                editCreation={editCreation}
                cancelCreation={idx => cancelCreations([idx])}
                insertCreation={insertCreation}
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

    useEffect(() => {
        const changePage = (ev: KeyboardEvent) => {
            if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
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
    const [count, setCount] = useState<number | null>(null);
    useEffect(() => {
        const retrieveCount = () => {
            setCount(null);
            const controller = new AbortController();
            const signal = controller.signal;
            const getCount = async () => {
                icatClient.getCount(filter, signal)
                    .then(c => setCount(c))
                    // Silently ignore errors, this is only a nice to have
                    .catch(() => {
                    });
            };
            const _ = getCount();
            return () => controller.abort();
        }

        return retrieveCount();
    }, [filter, icatClient]); // eslint-disable-line react-hooks/exhaustive-deps

    return <>{count !== null && <p class={style.tableTitleCount}>{count} matches</p>}</>
}

export default EntityTable;
