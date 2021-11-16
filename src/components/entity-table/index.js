import {useEffect, useState} from "preact/hooks";

import {entityNames} from '../../icat.js';

function format(data) {
    return <p>{data.length}</p>
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
            <p>{data === null ? "Loading..." : format(data)}</p>
        </div>
    );
}

export default EntityTable;
