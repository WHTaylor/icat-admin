import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityRow from '../row';
import ContextMenu from '../../context-menu';
import {defaultHeaderSort} from '../../../utils.js';

const EntityTableView = ({data, tableName, openRelated}) => {
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
        [...new Set(data.map(d => Object.keys(d)
                .filter(k => typeof data[0][k] !== "object"))
                .reduce((dk1, dk2) => dk1.concat(dk2)))]);
    return (
        <>
        <table>
            <tr>
                {keys.map(k => <th class={style.tableHeader}>{k}</th>)}
            </tr>
            {data.map(e =>
                <EntityRow
                    tableName={tableName}
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
