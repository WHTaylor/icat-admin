import {useEffect, useState} from "preact/hooks";

import EntityRow from '../row';
import ContextMenu from '../../context-menu';

const EntityTableView = ({data}) => {
    const [contextMenuPos, setcontextMenuPos] =  useState(null);
    const [contextMenuItems, setcontextMenuItems] =  useState(null);

    const openContextMenu = (x, y, callbacks) => {
        setcontextMenuPos([x, y]);
        setcontextMenuItems(callbacks);
    }

    // Note: early returns need to be after all hooks
    if (data.length === 0) return <p>No entries</p>;

    const keys = Object.keys(data[0])
        .filter(k => typeof data[0][k] !== "object");
    const f = (id, entityType) => {console.log(`Would switch to ${entityType} ${id}`)};
    return (
        <>
        <table>
            <tr>
                {keys.map(k => <th>{k}</th>)}
            </tr>
            {data.map(e =>
                <EntityRow
                    headers={keys}
                    entity={e}
                    showRelatedEntities={f}
                    openContextMenu={openContextMenu}/>)}
        </table>
        {contextMenuPos !== null &&
            <ContextMenu items={contextMenuItems} pos={contextMenuPos} />}
        </>
    );
}

export default EntityTableView;
