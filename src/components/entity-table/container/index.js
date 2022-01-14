import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityTableView from '../view';
import {randomSuffix, joinAttributeToTableName} from '../../../utils.js';

const EntityTable = ({icatClient, filter, handleFilterChange, openRelated, isOpen, changeSortField}) => {
    const [data, setData] = useState(null);
    const [errMsg, setErrMsg] = useState(null);
    const [contextMenuPos, setContextMenuPos] = useState(null);
    const [count, setCount] = useState(null);
    const [rowsToDelete, setRowsToDelete] = useState(new Set());

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

    useEffect(() => {
        return retrieveData();
    }, [filter]);

    useEffect(() => {
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

    const markToDelete = i =>
        setRowsToDelete(new Set([...rowsToDelete.add(i)]));

    const cancelDeletion = i => {
        rowsToDelete.delete(i);
        setRowsToDelete(new Set([...rowsToDelete]));
    }

    const doDeletions = async () => {
        let ids = [...rowsToDelete].map(i => data[i].id);
        return icatClient.deleteEntities(filter.table, ids)
            .then(() => {
                const removedDescending = [...rowsToDelete]
                    .sort((a, b) => b - a);
                const newData = [...data];
                removedDescending.forEach(i => newData.splice(i, 1))
                setData(newData);
            })
            .then(setRowsToDelete(new Set()));
    };

    return (
        <>
        <span class={style.tableTitleBar}>
            <h1 class={style.tableNameHeader}>{filter.table}</h1>
            <input
                type="text"
                class={style.filterInput}
                value={filter.where}
                placeholder="Filter by (ie. id = 1234)"
                onChange={ev => changeWhere(ev.target.value)}/>
            <button title="Refresh data" onClick={retrieveData}>↻</button>
            <PaginationControl
                isActive={isOpen}
                pageNumber={pageNumber}
                handleSetPage={handleSetPage}
                handleLimitChange={changeLimit}
                handlePageChange={changePage} />
            {count !== null &&
                <p class={style.tableTitleCount}>{count} matches</p>}
            <TableActions
                deletions={rowsToDelete}
                clearDeletions={() => setRowsToDelete(new Set())}
                doDeletions={doDeletions} />
        </span>
        {errMsg ? <p>{errMsg}</p>
            : <EntityTableView
                data={data}
                tableName={filter.table}
                deletions={rowsToDelete}
                openRelated={openRelated}
                changeSortField={changeSortField}
                saveEntityModifications={e =>
                    icatClient.writeEntity(filter.table, e)}
                modifyDataRow={changeData}
                markToDelete={markToDelete}
                cancelDeletion={cancelDeletion}
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

const TableActions = ({deletions, clearDeletions, doDeletions}) => {
    if (deletions.size === 0) return;
    return (<>
        <button onClick={clearDeletions}>Cancel deletions</button>
        <button onClick={doDeletions}>Delete {deletions.size} rows</button>
    </>);
};

export default EntityTable;
