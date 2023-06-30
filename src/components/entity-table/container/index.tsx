import {useEffect, useState} from "preact/hooks";
import {h, Fragment} from "preact";

import style from './style.css';

import {simplifyIcatErrMessage} from '../../../icatErrorHandling';
import IcatClient, {ExistingIcatEntity, NewIcatEntity, IcatEntityValue} from '../../../icat';
import EntityTableView from '../view';
import {difference, xToOneAttributeToEntityName, randomSuffix, TableFilter} from '../../../utils';
import {OpenRelatedHandler} from "../../context-menu";
import {EntityModification} from "../row";

type Props = {
    server: string;
    sessionId: string;
    filter: TableFilter;
    handleFilterChange: (filter: TableFilter) => void;
    openRelated: OpenRelatedHandler;
    isOpen: boolean;
    setSortingBy: (field: string, asc: boolean) => void;
    refreshData: () => void;
    key: number;
}

/**
 * EntityTable manages the state for a single opened table of entities.
 *
 * Contains controls for changing the data, and an {@link EntityTableView} to
 * display it.
 */
const EntityTable = ({
                         server,
                         sessionId,
                         filter,
                         handleFilterChange,
                         openRelated,
                         isOpen,
                         setSortingBy,
                         refreshData
                     }: Props) => {
    const [data, setData] = useState<ExistingIcatEntity[] | null>(null);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    // Row indexes that are marked to be deleted
    const [rowsToDelete, setRowsToDelete] = useState<Set<number>>(new Set());
    // Objects without ids to be written to ICAT
    const [rowsToCreate, setRowsToCreate] = useState<NewIcatEntity[]>([]);
    const icatClient = new IcatClient(server, sessionId);

    useEffect(() => {
        const retrieveData = () => {
            setData(null);
            setErrMsg(null);
            const controller = new AbortController();
            const signal = controller.signal;
            const getEntries = async () => {
                icatClient.getEntries(filter, signal)
                    .then(d => setData(d))
                    .catch(err => {
                        // DOMException gets throws if promise is aborted, which it is
                        // during cleanup `controller.abort()` when table/filter changes
                        // before request finishes
                        if (err instanceof DOMException) return;
                        setErrMsg(simplifyIcatErrMessage(err));
                    });
            };
            getEntries();
            return () => controller.abort();
        }

        return retrieveData();
    }, [filter, server, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const changeData = async (i: number, changes: EntityModification) => {
        const changed = [...(data || [])];

        // For related entity changes, we need to lookup the new entity in ICAT
        const resolve = async (
            field: string,
            value: string | number | { id: number })
            : Promise<[string, string | number | ExistingIcatEntity]> => {

            if (typeof (value) !== "object") return [field, value];

            const entityType = xToOneAttributeToEntityName(filter.table, field);
            const entity = await icatClient.getById(entityType!, value.id);
            return [field, entity];
        }

        const toResolve = Promise.all(Object.entries(changes)
            .map(([k, v]) => resolve(k, v)));

        await toResolve.then(changes => {
            const changeObj = Object.fromEntries(changes);
            changed[i] = {...changed[i], ...changeObj};
            setData(changed);
        });
    };

    const markToDelete = (id: number) =>
        setRowsToDelete(new Set([...rowsToDelete.add(id)]));

    const cancelDeletion = (id: number) => {
        rowsToDelete.delete(id);
        setRowsToDelete(new Set([...rowsToDelete]));
    }

    const deleteEntities = async (ids: number[]) =>
        icatClient.deleteEntities(filter.table, ids)
            .then(() => {
                const newData = (data || []).filter(e => !ids.includes(e.id));
                setData(newData);
            })
            .then(_ => setRowsToDelete(difference(rowsToDelete, new Set(ids))));

    const editCreation = (i: number, k: string, v: IcatEntityValue) => {
        const cur = rowsToCreate[i];
        const modified = {...cur, [k]: v};
        const newToCreate = [...rowsToCreate];
        newToCreate[i] = modified;
        setRowsToCreate(newToCreate);
    };

    const cancelCreate = (i: number) => {
        const newToCreate = [...rowsToCreate];
        newToCreate.splice(i, 1);
        setRowsToCreate(newToCreate);
    };

    const insertCreation = async (i: number, id: number) => {
        const created = await icatClient.getById(filter.table, id);
        const withCreated = [...(data || [])];
        withCreated.unshift(created);
        setData(withCreated);
        cancelCreate(i);
    };

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
                isActive={isOpen}
                pageNumber={pageNumber}
                handleSetPage={handleSetPage}
                handleLimitChange={changeLimit}
                handlePageChange={changePage}/>
            <EntityCounter filter={filter} icatClient={icatClient}/>
        </span>

        <span class={style.tableActionsBar}>
            <CreateActions
                creations={rowsToCreate}
                addCreation={() => setRowsToCreate(rowsToCreate.concat({}))}
                clearCreations={() => setRowsToCreate([])}/>
            <DeleteActions
                deletions={rowsToDelete}
                clearDeletions={() => setRowsToDelete(new Set())}
                doDeletions={() => deleteEntities([...rowsToDelete])}/>
        </span>

        {errMsg
            ? <p>{errMsg}</p>
            : <EntityTableView
                data={data}
                entityType={filter.table}
                sortingBy={{field: filter.sortField, asc: filter.sortAsc}}
                deletions={rowsToDelete}
                creations={rowsToCreate}
                openRelated={openRelated}
                setSortingBy={setSortingBy}
                saveEntity={e =>
                    icatClient.writeEntity(filter.table, e)}
                modifyDataRow={changeData}
                markToDelete={markToDelete}
                cancelDeletion={cancelDeletion}
                doDelete={(id: number) => deleteEntities([id])}
                editCreation={editCreation}
                cancelCreate={cancelCreate}
                insertCreation={insertCreation}
            />}
    </>);
}

type PaginationProps = {
    isActive: boolean;
    pageNumber: number;
    handleSetPage: (n: number) => void;
    handleLimitChange: (n: number) => void;
    handlePageChange: (n: number) => void;
}

const PaginationControl = (
    {
        isActive, pageNumber, handleSetPage, handleLimitChange, handlePageChange
    }: PaginationProps) => {
    const decPage = () => handlePageChange(-1);
    const incPage = () => handlePageChange(1);

    const suffix = randomSuffix();
    const prevId = `previousPageBtn_${suffix}`;
    const nextId = `nextPageBtn_${suffix}`;

    const focusOkForPageChange = () => {
        return isActive
            && (document.activeElement === document.body
                || document.activeElement === document.getElementById(prevId)
                || document.activeElement === document.getElementById(nextId));
    };

    useEffect(() => {
        const changePage = (ev: KeyboardEvent) => {
            if (!focusOkForPageChange()) return;
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
    doDeletions: () => void;
}
const DeleteActions = (
    {
        deletions, clearDeletions, doDeletions
    }: DeleteProps) => {
    if (deletions.size === 0) return <></>;
    return (
        <span>
            <button onClick={doDeletions}>Delete {deletions.size} rows</button>
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
            getCount();
            return () => controller.abort();
        }

        return retrieveCount();
    }, [filter, icatClient]); // eslint-disable-line react-hooks/exhaustive-deps

    return <>{count !== null && <p class={style.tableTitleCount}>{count} matches</p>}</>
}

export default EntityTable;
