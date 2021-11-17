import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityTableView from '../view';

// The API is returning data packed into an object for some reason
function unpack(data) {
    if (data.length === 0) return [];
    const dataType = Object.keys(data[0]);
    return data.map(d => d[dataType]);
}

const EntityTable = ({icatClient, sessionId, table}) => {
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState(null);
    const [errMsg, setErrMsg] = useState(null);
    const [contextMenuPos, setContextMenuPos] = useState(null);

    useEffect(() => {
        setData(null);
        setErrMsg(null);
        const controller = new AbortController();
        const signal = controller.signal;
        const getEntries = async () => {
            icatClient.getEntries(
                    sessionId, table, 0, 50, filter, signal)
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
    }, [table, filter]);

    return (
        <div>
            <span class={style.tableTitleBar}>
                <h1 class={style.tableNameHeader}>{table}</h1>
                <input
                    type="text"
                    class={style.filterInput}
                    placeholder="Filter by (ie. id = 1234)"
                    onChange={ev => setFilter(ev.target.value)}/>
            </span>
            {errMsg ? <p>{errMsg}</p>
                : data === null ? <p>Loading...</p>
                    : <EntityTableView data={unpack(data)} />}
        </div>
    );
}

export default EntityTable;
