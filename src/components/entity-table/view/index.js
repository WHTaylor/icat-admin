import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityRow from '../row';
import ContextMenu from '../../context-menu';
import {defaultHeaderSort} from '../../../utils.js';

const EntityTableView = ({data, openRelated}) => {
    const [contextMenuPos, setContextMenuPos] =  useState(null);
    const [contextMenuItems, setContextMenuItems] =  useState(null);

    const clearContextMenu = () => {
        setContextMenuPos(null);
        setContextMenuItems(null);
    };

    const openContextMenu = (x, y, callbacks) => {
        setContextMenuPos([x, y]);
        setContextMenuItems(callbacks);
    };

    useEffect(() => {
        document.addEventListener("click", clearContextMenu);
        return () => document.removeEventListener("click", clearContextMenu);
    });

    // Note: early returns need to be after all hooks
    if (data.length === 0) return <p>No entries</p>;

    const keys = defaultHeaderSort(
        Object.keys(data[0])
            .filter(k => typeof data[0][k] !== "object"));
    return (
        <>
        <table>
            <tr>
                {keys.map(k => <th class={style.tableHeader}>{k}</th>)}
            </tr>
            {data.map(e =>
                <EntityRow
                    headers={keys}
                    entity={e}
                    showRelatedEntities={openRelated}
                    openContextMenu={openContextMenu}/>)}
        </table>
        {contextMenuPos !== null &&
            <ContextMenu items={contextMenuItems} pos={contextMenuPos} />}
        </>
    );
}

export default EntityTableView;
