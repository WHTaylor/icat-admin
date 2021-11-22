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

    return (
        <div>
            <span class={style.tableTitleBar}>
                <h1 class={style.tableNameHeader}>{filter.table}</h1>
                <input
                    type="text"
                    class={style.filterInput}
                    value={filter.where}
                    placeholder="Filter by (ie. id = 1234)"
                    onChange={ev => handleFilterChange(ev.target.value)}/>
                {count !== null &&
                    <p class={style.tableTitleCount}>{count} matches</p>}
            </span>
            {errMsg ? <p>{errMsg}</p>
                : data === null ? <p>Loading...</p>
                    : <EntityTableView data={data} openRelated={openRelated} />}
        </div>
    );
}

export default EntityTable;
