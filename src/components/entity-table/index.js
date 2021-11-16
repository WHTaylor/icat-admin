import {useEffect, useState} from "preact/hooks";

import {entityNames} from '../../icat.js';

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
            {unpacked.map(e =>
                <tr>
                    {keys.map(k => <td>{e[k]}</td>)}
                </tr>)}
        </table>
    );
}

const EntityTable = ({icatClient, sessionId, table}) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        setData(null);
        const controller = new AbortController();
        const signal = controller.signal;
        const getEntries = async () => {
            const d = await icatClient.getEntries(sessionId, table, 0, 50, signal);
            setData(d);
        };
        getEntries();
        return () => controller.abort();
    }, [table]);

    return (
        <div>
            <h1>{table}</h1>
            {data === null ? <p>Loading...</p> : format(data)}
        </div>
    );
}

export default EntityTable;
