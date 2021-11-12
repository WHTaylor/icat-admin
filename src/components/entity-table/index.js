import {useEffect, useState} from "preact/hooks";

import {entityNames} from '../../icat.js';

function format(data) {
    return <p>{data.length}</p>
}

const EntityTable = ({icatClient, sessionId, table}) => {
    const [data, setData] = useState(null);
    console.log("Render entitytable");

    if (data === null) {
        console.log("Getting data");
        useEffect(async() => {
            const d = await icatClient.getEntries(sessionId, table, 0, 50);
            setData(d);
        });
    }

    return (
        <div>
            <h1>{table}</h1>
            <p>{data === null ? "Loading..." : format(data)}</p>
        </div>
    );
}

export default EntityTable;
