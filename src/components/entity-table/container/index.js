import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityTableView from '../view';

const EntityTable = ({icatClient, sessionId, filter, openRelated, handleFilterChange}) => {
    const [data, setData] = useState(null);
    const [errMsg, setErrMsg] = useState(null);
    const [contextMenuPos, setContextMenuPos] = useState(null);
    const [count, setCount] = useState(null);

    useEffect(() => {
        setData(null);
        setErrMsg(null);
        const controller = new AbortController();
        const signal = controller.signal;
        const getEntries = async () => {
            icatClient.getEntries(
                    sessionId, filter, signal)
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
    }, [filter]);

    useEffect(() => {
        setCount(null);
        const controller = new AbortController();
        const signal = controller.signal;
        const getCount = async () => {
            icatClient.getCount(
                    sessionId, filter.table, filter.where, signal)
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
    }
    const pageNumber = Math.floor(filter.offset / filter.limit) + 1;

    return (
        <div>
            <span class={style.tableTitleBar}>
                <h1 class={style.tableNameHeader}>{filter.table}</h1>
                <input
                    type="text"
                    class={style.filterInput}
                    value={filter.where}
                    placeholder="Filter by (ie. id = 1234)"
                    onChange={ev => changeWhere(ev.target.value)}/>
                <PaginationControl
                    pageNumber={pageNumber}
                    handleLimitChange={changeLimit}
                    handlePageChange={changePage} />
                {count !== null &&
                    <p class={style.tableTitleCount}>{count} matches</p>}
            </span>
            {errMsg ? <p>{errMsg}</p>
                : data === null ? <p>Loading...</p>
                    : <EntityTableView data={data} openRelated={openRelated} />}
        </div>
    );
}

const PaginationControl = ({pageNumber, handleLimitChange, handlePageChange}) => {
    const decPage = () => handlePageChange(-1);
    const incPage = () => handlePageChange(1);

    const focusOkForPageChange = () => {
        return document.activeElement === document.body
            || document.activeElement === document.getElementById("previousPageBtn")
            || document.activeElement === document.getElementById("nextPageBtn");
    };

    useEffect(() => {
        const left = ev => {
            if (!focusOkForPageChange()) return;
            if (ev.key !== "ArrowLeft") return;
            ev.preventDefault();
            decPage();
        };
        const right = ev => {
            if (!focusOkForPageChange()) return;
            if (ev.key !== "ArrowRight") return;
            ev.preventDefault();
            incPage();
        };
        document.addEventListener("keydown", left);
        document.addEventListener("keydown", right);
        return () => {
            document.removeEventListener("keydown", left);
            document.removeEventListener("keydown", right);
        }
    });

    return (
        <span>
            <button onClick={decPage} id="previousPageBtn">Previous</button>
            {pageNumber}
            <button onClick={incPage} id="nextPageBtn">Next</button>
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

export default EntityTable;
