import {useEffect, useState} from "preact/hooks";

import EntityRow from '../row';

function format(data) {
    if (data.length === 0) return <p>No entries</p>;

    const keys = Object.keys(data[0])
        .filter(k => typeof data[0][k] !== "object");
    const f = (id, entityType) => {console.log(`Would switch to ${entityType} ${id}`)};
    return (
        <table>
            <tr>
                {keys.map(k => <th>{k}</th>)}
            </tr>
            {data.map(e =>
                <EntityRow headers={keys} entity={e} contextMenuFilter={f}/>)}
        </table>
    );
}

const EntityTableView = ({data}) => {
    return format(data);
}

export default EntityTableView;
