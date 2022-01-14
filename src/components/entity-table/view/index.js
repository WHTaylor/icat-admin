import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityRow from '../row';
import ContextMenu from '../../context-menu';
import {defaultHeaderSort, joinAttributeToTableName} from '../../../utils.js';

const EntityTableView = ({
    data, tableName, deletions,
    openRelated, changeSortField, saveEntityModifications, modifyDataRow, markToDelete, cancelDeletion}) =>
{
    const [contextMenuPos, setContextMenuPos] =  useState(null);
    const [contextMenuItems, setContextMenuItems] =  useState(null);
    // Locally saved changes to entities
    const [entityModifications, setEntityModifications] = useState({});
    // [Entity id, field key] being edited. [null, null] for nothing
    const [fieldBeingEdited, setFieldBeingEdited] = useState([null, null]);
    const stopEditing = () => setFieldBeingEdited([null, null]);
    // Field to show for each related entity in table
    const [relatedDisplayFields, setRelatedDisplayFields] = useState({});

    const clearContextMenu = () => {
        setContextMenuPos(null);
        setContextMenuItems(null);
    };

    const openContextMenu = (x, y, callbacks) => {
        setContextMenuPos([x, y]);
        setContextMenuItems(callbacks);
        stopEditing();
    };

    useEffect(() => {
        const cancelInteractions = () => {
            clearContextMenu();
            stopEditing();
        };
        document.addEventListener("click", cancelInteractions);
        return () => document.removeEventListener("click", cancelInteractions);
    });

    // Note: early returns need to be after all hooks
    if (data === null) return <p>Loading...</p>;
    if (data.length === 0) return <p>No entries</p>;

    const editEntity = (id, field, value) => {
        const cur = entityModifications[id] === undefined
            ? {id: id}
            : entityModifications[id];
        var fieldIsEntity = joinAttributeToTableName(tableName, field) !== null;
        const newValue = fieldIsEntity
            // TODO: Don't hardcode this to set id, and should probably validate it
            ? { id: Number.parseInt(value) }
            : value;
        const edited = {...cur, [field]: newValue};
        const newModified = {...entityModifications, [id]: edited};
        setEntityModifications(newModified);
        stopEditing();
    };

    const removeModifications = id =>
        setEntityModifications({...entityModifications, [id]: undefined});

    const dataAttributes = data
        .map(d => Object.keys(d)
            .filter(k => !Array.isArray(d[k])));
    const keys = defaultHeaderSort(
        [...new Set(dataAttributes.reduce((dk1, dk2) => dk1.concat(dk2)))]);

    const showRelatedFieldDisplayOptions = k => {
        const v = data[0][k];
        return typeof v === "object" && !Array.isArray(v)
    };

    const relatedFieldDisplaySelect = k => {
        const setDisplayField = v =>
            setRelatedDisplayFields({...relatedDisplayFields, [k]: v});
        const v = data.find(e => e[k] !== undefined && e[k] !== null)[k];
        return (<select onChange={ev => setDisplayField(ev.target.value)}>
            {Object.keys(v)
                    .filter(vk => typeof v[vk] !== "object")
                    .map(vk =>
                <option
                    value={vk}
                    selected={relatedDisplayFields[k] === vk}>{vk}</option>)}
        </select>);
    };

    return (
        <>
        <table>
            <tr>
                <th></th>{ /* Empty row for action buttons (save/revert changes)*/ }
                {keys.map(k =>
                    <th class={style.tableHeader}>
                        <p onClick={() => changeSortField(k)}>{k}</p>
                        {showRelatedFieldDisplayOptions(k) &&
                                relatedFieldDisplaySelect(k)}
                    </th>)}
            </tr>
            {data.map((e, i) =>
                <EntityRow
                    key={e.id}
                    tableName={tableName}
                    headers={keys}
                    entity={e}
                    modifications={entityModifications[e.id]}
                    editingField={fieldBeingEdited[0] === e.id
                        ? fieldBeingEdited[1]
                        : null}
                    relatedEntityDisplayFields={relatedDisplayFields}
                    showRelatedEntities={openRelated}
                    openContextMenu={openContextMenu}
                    startEditing={field => {
                        clearContextMenu();
                        setFieldBeingEdited([e.id, field]);
                    }}
                    stopEditing={stopEditing}
                    makeEdit={(k, v) => editEntity(e.id, k, v)}
                    saveEntityModifications={saveEntityModifications}
                    revertChanges={() => removeModifications(e.id)}
                    syncModifications={async () =>
                        await modifyDataRow(i, entityModifications[e.id])
                            .then(() => removeModifications(e.id))}
                    markToDelete={() => markToDelete(i)}
                    cancelDeletion={() => cancelDeletion(i)}
                    markedForDeletion={deletions.has(i)}
                />)}
        </table>
        {contextMenuPos !== null &&
            <ContextMenu items={contextMenuItems} pos={contextMenuPos} />}
        </>
    );
}

export default EntityTableView;
