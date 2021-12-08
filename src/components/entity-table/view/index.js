import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityRow from '../row';
import ContextMenu from '../../context-menu';
import {defaultHeaderSort} from '../../../utils.js';

const EntityTableView = ({data, tableName, openRelated, changeSortField, saveModifiedEntity}) => {
    const [contextMenuPos, setContextMenuPos] =  useState(null);
    const [contextMenuItems, setContextMenuItems] =  useState(null);
    const [entityModifications, setEntityModifications] = useState({});
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
        const cur = entityModifications[id] === undefined
            ? {id: id}
            : entityModifications[id];
        const edited = {...cur, [field]: value};
        const newModified = {...entityModifications, [id]: edited};
        setEntityModifications(newModified);
        setFieldBeingEdited([null, null]);
    };

    const removeModifications = id =>
        setEntityModifications({...entityModifications, [id]: undefined});

    const dataAttributes = data
        .map(d => Object.keys(d)
            .filter(k => !Array.isArray(d[k])));
    const keys = defaultHeaderSort(
        [...new Set(dataAttributes.reduce((dk1, dk2) => dk1.concat(dk2)))]);
    return (
        <>
        <table>
            <tr>
                <th></th>{ /* Empty row for action buttons (save/revert changes)*/ }
                {keys.map(k =>
                    <th class={style.tableHeader}>
                        <p onClick={() => changeSortField(k)}>{k}</p>
                    </th>)}
            </tr>
            {data.map(e =>
                <EntityRow
                    key={e.id}
                    tableName={tableName}
                    headers={keys}
                    entity={e}
                    modifications={entityModifications[e.id]}
                    editingField={fieldBeingEdited[0] === e.id
                        ? fieldBeingEdited[1]
                        : null}
                    showRelatedEntities={openRelated}
                    openContextMenu={openContextMenu}
                    startEditing={field => setFieldBeingEdited([e.id, field])}
                    stopEditing={() => setFieldBeingEdited([null, null])}
                    makeEdit={(k, v) => editEntity(e.id, k, v)}
                    saveModifiedEntity={saveModifiedEntity}
                    revertChanges={() => removeModifications(e.id)}
                />)}
        </table>
        {contextMenuPos !== null &&
            <ContextMenu items={contextMenuItems} pos={contextMenuPos} />}
        </>
    );
}

export default EntityTableView;
