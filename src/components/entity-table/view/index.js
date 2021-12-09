import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityRow from '../row';
import ContextMenu from '../../context-menu';
import {defaultHeaderSort} from '../../../utils.js';

const EntityTableView = ({
    data, tableName,
    openRelated, changeSortField, saveEntityModifications, modifyDataRow}) =>
{
    const [contextMenuPos, setContextMenuPos] =  useState(null);
    const [contextMenuItems, setContextMenuItems] =  useState(null);
    // Locally saved changes to entities
    const [entityModifications, setEntityModifications] = useState({});
    // [Entity id, field key] being edited. [null, null] for nothing
    const [fieldBeingEdited, setFieldBeingEdited] = useState([null, null]);
    // Field to show for each related entity in table
    const [relatedDisplayFields, setRelatedDisplayFields] = useState({});

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

    const showRelatedFieldDisplayOptions = k => {
        const v = data[0][k];
        return typeof v === "object" && !Array.isArray(v)
    };

    const relatedFieldDisplaySelect = k => {
        const setDisplayField = v =>
            setRelatedDisplayFields({...relatedDisplayFields, [k]: v});
        const v = data[0][k];
        return (<select onChange={ev => setDisplayField(ev.target.value)}>
            {Object.keys(v)
                    .filter(vk => typeof v[vk] !== "object")
                    .map(vk =>
                <option value={vk}>{vk}</option>)}
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
                    relatedEntityDisplayField={relatedDisplayFields}
                    showRelatedEntities={openRelated}
                    openContextMenu={openContextMenu}
                    startEditing={field => setFieldBeingEdited([e.id, field])}
                    stopEditing={() => setFieldBeingEdited([null, null])}
                    makeEdit={(k, v) => editEntity(e.id, k, v)}
                    saveEntityModifications={saveEntityModifications}
                    revertChanges={() => removeModifications(e.id)}
                    syncModifications={() => {
                        modifyDataRow(i, entityModifications[e.id])
                        removeModifications(e.id);
                    }}
                />)}
        </table>
        {contextMenuPos !== null &&
            <ContextMenu items={contextMenuItems} pos={contextMenuPos} />}
        </>
    );
}

export default EntityTableView;
