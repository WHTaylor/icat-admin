import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityTableView from '../view';
import {randomSuffix, joinAttributeToTableName} from '../../../utils.js';

const EntityTable = ({icatClient, filter, handleFilterChange, openRelated, isOpen, changeSortField, refreshData}) => {
    const [data, setData] = useState(null);
    const [errMsg, setErrMsg] = useState(null);
    const [contextMenuPos, setContextMenuPos] = useState(null);
    const [count, setCount] = useState(null);
    const [rowsToDelete, setRowsToDelete] = useState(new Set());
    const [rowsToCreate, setRowsToCreate] = useState([]);

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
                    setErrMsg(err);});
        };
        getEntries();
        return () => controller.abort();
    }

    const retrieveCount = () => {
        setCount(null);
        const controller = new AbortController();
        const signal = controller.signal;
        const getCount = async () => {
            icatClient.getCount(filter, signal)
                .then(d => setCount(d[0]))
                // Silently ignore errors, this is only a nice to have
                .catch(err => {});
        };
        getCount();
        return () => controller.abort();
    }

    useEffect(() => {
        return retrieveData();
    }, [filter]);

    useEffect(() => {
        return retrieveCount();
    }, [filter]);

    const changeWhere = w => handleFilterChange({...filter, where: w});
    const changeLimit = l => handleFilterChange({...filter, limit: l});
    const changePage = change => {
        const newOffset = Math.max(0, filter.offset + (filter.limit * change));
        if (newOffset === filter.offset) return;
        handleFilterChange({...filter, offset: newOffset});
    };
    const handleSetPage = n => {
        const newOffset = Math.max(0, filter.limit * (n - 1));
        if (newOffset === filter.offset) return;
        handleFilterChange({...filter, offset: newOffset});
    };
    const pageNumber = Math.floor(filter.offset / filter.limit) + 1;

    const changeData = async (i, changes) => {
        const changed = [...data];

        // For related entity changes, we need to lookup the new entity in ICAT
        const resolve = async (field, value) => {
            if (typeof(value) !== "object") return [field, value];

            const entityType = joinAttributeToTableName(filter.table, field);
            return [field, await icatClient.getById(entityType, value.id)];
        }

        const toResolve = Promise.all(Object.entries(changes)
            .map(([k, v]) => resolve(k, v)));

        await toResolve.then(changes => {
            const changeObj = Object.fromEntries(changes);
            changed[i] = {...changed[i], ...changeObj};
            setData(changed);
        });
    };

    const markToDelete = id =>
        setRowsToDelete(new Set([...rowsToDelete.add(id)]));

    const cancelDeletion = id => {
        rowsToDelete.delete(id);
        setRowsToDelete(new Set([...rowsToDelete]));
    }

    const doDeletions = async () => {
        let ids = [...rowsToDelete];
        return icatClient.deleteEntities(filter.table, ids)
            .then(() => {
                const newData = data.filter(e => !ids.includes(e.id));
                setData(newData);
            })
            .then(setCount(count - rowsToDelete.size))
            .then(setRowsToDelete(new Set()));
    };

    const editCreation = (i, k, v) => {
        const cur = rowsToCreate[i];
        const modified = {...cur, [k]: v};
        const newToCreate = [...rowsToCreate];
        newToCreate[i] = modified;
        setRowsToCreate(newToCreate);
    };

    const cancelCreate = i => {
        const newToCreate = [...rowsToCreate];
        newToCreate.splice(i, 1);
        setRowsToCreate(newToCreate);
    };

    const insertCreation = async (i, id) => {
        const created = await icatClient.getById(filter.table, id);
        const withCreated = [...data]; withCreated.unshift(created);
        setData(withCreated);
        cancelCreate(i);
    };

    return (
        <>
        <span class={style.tableTitleBar}>
            <div>
                <h1 class={style.tableNameHeader}>{filter.table}</h1>
                <CreateActions
                    creations={rowsToCreate}
                    addCreation={() => setRowsToCreate(rowsToCreate.concat({}))}
                    clearCreations={() => setRowsToCreate([])} />
            </div>
            <input
                type="text"
                class={style.filterInput}
                value={filter.where}
                placeholder="Filter by (ie. id = 1234)"
                onChange={ev => changeWhere(ev.target.value)}/>
            <button title="Refresh data" onClick={refreshData}>↻</button>
            <PaginationControl
                isActive={isOpen}
                pageNumber={pageNumber}
                handleSetPage={handleSetPage}
                handleLimitChange={changeLimit}
                handlePageChange={changePage} />
            {count !== null &&
                <p class={style.tableTitleCount}>{count} matches</p>}
            <DeleteActions
                deletions={rowsToDelete}
                clearDeletions={() => setRowsToDelete(new Set())}
                doDeletions={doDeletions} />
        </span>
        {errMsg ? <p>{errMsg}</p>
            : <EntityTableView
                data={data}
                tableName={filter.table}
                deletions={rowsToDelete}
                creations={rowsToCreate}
                openRelated={openRelated}
                changeSortField={changeSortField}
                saveEntity={e =>
                    icatClient.writeEntity(filter.table, e)}
                modifyDataRow={changeData}
                markToDelete={markToDelete}
                cancelDeletion={cancelDeletion}
                editCreation={editCreation}
                cancelCreate={cancelCreate}
                insertCreation={insertCreation}
            />}
        </>
    );
}

const PaginationControl = ({isActive, pageNumber, handleSetPage, handleLimitChange, handlePageChange}) => {
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
        const left = ev => {
            if (!focusOkForPageChange()) return;
            if (ev.key !== "ArrowLeft") return;
            ev.preventDefault();
            document.getElementById(prevId).click();
        };
        const right = ev => {
            if (!focusOkForPageChange()) return;
            if (ev.key !== "ArrowRight") return;
            ev.preventDefault();
            document.getElementById(nextId).click();
        };
        document.addEventListener("keydown", left);
        document.addEventListener("keydown", right);
        return () => {
            document.removeEventListener("keydown", left);
            document.removeEventListener("keydown", right);
        }
    });

    return (
        <span class={style.paginationControl}>
            <button onClick={decPage} id={prevId}>Previous</button>
            <input type="number"
                value={pageNumber}
                class={style.pageInput}
                onChange={ev => handleSetPage(ev.target.value)} />
            <button onClick={incPage} id={nextId}>Next</button>
            <span>
                <label for="pageSizeInput">Per page:</label>
                <select name="pageSizeInput" onChange={
                        ev => handleLimitChange(Number.parseInt(ev.target.value))}>
                    <option value="20">20</option>
                    <option value="50" selected>50</option>
                    <option value="100">100</option>
                </select>
            </span>
        </span>
    );
}

const DeleteActions = ({deletions, clearDeletions, doDeletions}) => {
    if (deletions.size === 0) return;
    return (<>
        <button onClick={clearDeletions}>Cancel deletions</button>
        <button onClick={doDeletions}>Delete {deletions.size} rows</button>
    </>);
};

const CreateActions = ({creations, addCreation, clearCreations}) => {
    return (
        <div>
            <button onClick={addCreation}>Add new</button>
            {creations.length > 0 &&
                <button onClick={clearCreations}>Cancel creations</button>
                }
        </div>);
};

export default EntityTable;
