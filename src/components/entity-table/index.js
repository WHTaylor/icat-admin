import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import EntityRow from '../entity-row';

// The API is returning data packed into an object for some reason
function unpack(data) {
    const dataType = Object.keys(data[0]);
    return data.map(d => d[dataType]);
}

function format(data) {
    if (data.length === 0) return <p>No entries</p>;

    const unpacked = unpack(data);
    const keys = Object.keys(unpacked[0])
        .filter(k => typeof unpacked[0][k] !== "object");
    return (
        <table>
            <tr onClick={() => console.log("head")}>
                {keys.map(k => <th>{k}</th>)}
            </tr>
            {unpacked.map(e => <EntityRow headers={keys} entity={e} />)}
        </table>
    );
}

const EntityTable = ({icatClient, sessionId, table}) => {
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState(null);
    const [errMsg, setErrMsg] = useState(null);

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
                    if (err instanceof DOMException) return;
                    setErrMsg(err);});
        };
        getEntries();
        return () => controller.abort();
    }, [table, filter]);

    return (
        <div>
            <span>
                <h1 class={style.tableHeader}>{table}</h1>
                <input type="text" onChange={ev => setFilter(ev.target.value)}/>
            </span>
            {errMsg ? <p>{errMsg}</p>
                : data === null ? <p>Loading...</p>
                    : format(data)}
        </div>
    );
}

export default EntityTable;
