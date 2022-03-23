import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import EntityRow from '../row';
import ContextMenu from '../../context-menu';
import {defaultHeaderSort, joinAttributeToTableName} from '../../../utils.js';

const EntityTableView = ({
    data, tableName, sortingBy, deletions, creations,
    openRelated, toggleSortBy, saveEntity, modifyDataRow,
    markToDelete, cancelDeletion, doDelete,
    editCreation, cancelCreate, insertCreation
}) =>
{
    const [contextMenuPos, setContextMenuPos] =  useState(null);
    const [contextMenuItems, setContextMenuItems] =  useState(null);
    // Locally saved changes to entities
    const [entityModifications, setEntityModifications] = useState({});
    // fieldBeing edited is:
    // [null, null] - nothing being edited
    // if editingNewRow, [index in creations, field]
    // else [entity id, field]
    const [editingNewRow, setEditingNewRow] = useState(null);
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

    const editEntity = (id, field, newValue) => {
        const cur = entityModifications[id] === undefined
            ? {}
            : entityModifications[id];
        const originalValue = data.filter(e => e.id === id)[0][field];
        const edited = {...cur, [field]: newValue};
        // If we've modified the value back to the original, remove the modification
        if (newValue === originalValue
            || typeof originalValue === "object" && originalValue.id === newValue.id) {
            delete edited[field];
        }
        const newModified = {...entityModifications, [id]: edited};
        // If all values have been reverted back to the originals, remove modifications
        if (Object.keys(edited).length === 0) {
            delete newModified[id];
        }
        setEntityModifications(newModified);
    };

    const removeModifications = id =>
        setEntityModifications({...entityModifications, [id]: undefined});

    const dataAttributes = data
        .map(d => Object.keys(d)
            .filter(k => !Array.isArray(d[k])));
    const keys = defaultHeaderSort(
        [...new Set(dataAttributes.reduce((dk1, dk2) => dk1.concat(dk2)))]);

    const shouldShowRelatedFieldDisplayOptions = k => {
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

    const buildEntityRow = (e, i) => {
        const isNewRow = e.id === undefined;
        const key = isNewRow ? "thisIsABadKeyToUse" + i : e.id;
        const makeEdit = (k, v) => {
            var fieldIsEntity = joinAttributeToTableName(tableName, k) !== null;
            const newValue = fieldIsEntity
                // TODO: Don't hardcode this to id, and should probably validate it
                ? { id: Number.parseInt(v) }
                : v;
            isNewRow
                ? editCreation(i, k, newValue)
                : editEntity(e.id, k, newValue);
            stopEditing();
        }
        const syncModifications = isNewRow
            ? async id => await insertCreation(i, id)
            : async () => await modifyDataRow(i, entityModifications[e.id])
                    .then(() => removeModifications(e.id));
        const revertChanges = isNewRow
            ? () => cancelCreate(i)
            : () => removeModifications(e.id);
        return <EntityRow
            key={key}
            tableName={tableName}
            headers={keys}
            entity={e}
            modifications={isNewRow ? undefined : entityModifications[e.id]}
            editingField={
                editingNewRow
                    ? isNewRow
                        ? fieldBeingEdited[0] === i
                            ? fieldBeingEdited[1]
                            : null
                        : null
                    : !isNewRow
                        ? fieldBeingEdited[0] === e.id
                            ? fieldBeingEdited[1]
                            : null
                        : null} // This is insane
            relatedEntityDisplayFields={relatedDisplayFields}
            showRelatedEntities={openRelated}
            openContextMenu={openContextMenu}
            startEditing={field => {
                clearContextMenu();
                setFieldBeingEdited([isNewRow ? i : e.id, field]);
                setEditingNewRow(isNewRow);
            }}
            stopEditing={stopEditing}
            makeEdit={makeEdit}
            saveEntity={saveEntity}
            revertChanges={revertChanges}
            syncModifications={syncModifications}
            markToDelete={() => markToDelete(e.id)}
            cancelDeletion={() => cancelDeletion(e.id)}
            doDelete={() => doDelete(e.id)}
            markedForDeletion={deletions.has(e.id)} />;
    };

    return (
        <>
        <table>
            <tr>
                <th>Actions</th>
                {keys.map(k =>
                    <th key={k + "-header"}>
                        <div class={style.tableHeaderContainer}>
                            <span class={style.tableHeading}>
                                {k}
                                <span>
                                    <button
                                        class={sortingBy.field === k && sortingBy.asc
                                            && style.activeSort}
                                        onClick={() => toggleSortBy(k, true)}
                                        title={`Sort by ${k}, ascending`}>
                                        ▲
                                    </button>
                                    <button
                                        class={sortingBy.field === k && !sortingBy.asc
                                            && style.activeSort}
                                        onClick={() => toggleSortBy(k, false)}
                                        title={`Sort by ${k}, descending`}>
                                        ▼
                                    </button>
                                </span>
                            </span>
                        {shouldShowRelatedFieldDisplayOptions(k) &&
                                relatedFieldDisplaySelect(k)}
                        </div>
                    </th>)}
            </tr>
            {creations.concat(data).map((e, i) => buildEntityRow(e, i))}
        </table>
        {contextMenuPos !== null &&
            <ContextMenu items={contextMenuItems} pos={contextMenuPos} />}
        </>
    );
}

export default EntityTableView;
