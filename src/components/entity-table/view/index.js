import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityRow from '../row';
import ContextMenu from '../../context-menu';
import {defaultHeaderSort} from '../../../utils.js';

const EntityTableView = ({data, tableName, openRelated, changeSortField}) => {
    const [contextMenuPos, setContextMenuPos] =  useState(null);
    const [contextMenuItems, setContextMenuItems] =  useState(null);
    const [modifiedEntities, setModifiedEntities] = useState({});
    const [fieldBeingEdited, setFieldBeingEdited] = useState([null, null]);

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

    const editEntity = (id, field, value) => {
        const cur = modifiedEntities[id] === undefined
            ? data.filter(e => e.id === id)[0]
            : modifiedEntities[id];
        // Not sure if there's a proper way to do this.
        // 'field' in {...cur, field: value} is taken as the literal value.
        const edited = {...cur}; edited[field] = value
        const newModified = {...modifiedEntities}; newModified[id] = edited;
        setModifiedEntities(newModified);
        setFieldBeingEdited([null, null]);
    };

    const dataAttributes = data
        .map(d => Object.keys(d)
            .filter(k => !Array.isArray(d[k])));
    const keys = defaultHeaderSort(
        [...new Set(dataAttributes.reduce((dk1, dk2) => dk1.concat(dk2)))]);
    return (
        <>
        <table>
            <tr>
                {keys.map(k => <th
                    onClick={() => changeSortField(k)}
                    class={style.tableHeader}>{k}</th>)}
            </tr>
            {data.map(e =>
                <EntityRow
                    key={e.id}
                    tableName={tableName}
                    headers={keys}
                    entity={Object.keys(modifiedEntities).includes(e.id.toString())
                        ? modifiedEntities[e.id]
                        : e}
                    editingField={fieldBeingEdited[0] === e.id
                        ? fieldBeingEdited[1]
                        : null}
                    showRelatedEntities={openRelated}
                    openContextMenu={openContextMenu}
                    startEditing={field => setFieldBeingEdited([e.id, field])}
                    makeEdit={(k, v) => editEntity(e.id, k, v)}
                />)}
        </table>
        {contextMenuPos !== null &&
            <ContextMenu items={contextMenuItems} pos={contextMenuPos} />}
        </>
    );
}

export default EntityTableView;
