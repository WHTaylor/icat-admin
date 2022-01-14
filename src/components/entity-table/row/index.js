import {useEffect, useState, useRef} from "preact/hooks";
import style from './style.css';

import {icatAttributeToTableName, joinAttributeToTableName, isDatetime, commonFields} from '../../../utils.js';
import ReadMore from '../../generic/read-more';

function formatCellContent(cellContent) {
    if (cellContent === undefined || cellContent === null) return "";

    return typeof cellContent !== "string"
        ? typeof cellContent === "object"
            ? cellContent.id.toString()
            : cellContent.toString()
        : isDatetime(cellContent)
            ? new Date(cellContent).toLocaleString()
            : cellContent;
}

const EntityRow = ({
    tableName, entity, modifications, headers, editingField, relatedEntityDisplayFields, markedForDeletion,
    showRelatedEntities, openContextMenu,
    startEditing, stopEditing, makeEdit, saveEntityModifications, revertChanges, syncModifications,
    markToDelete, cancelDeletion}) =>
{
    const inputEl = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(null);

    // Pairs of (relatedTable, openFunction) for all relatedTables which are
    // many-one with tableName (ie. investigation -> datasets)
    const relatedArrayCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () =>
            showRelatedEntities(
                icatAttributeToTableName(tableName, k),
                entity.id,
                true,
                tableName.endsWith("Type"))]);

    // Pairs of (relatedTable, openFunction) for all relatedTables which tableName is
    // one-X (ie. datafile -> dataset)
    const relatedSingleCallbacks = Object.keys(entity)
        .filter(k => !Array.isArray(entity[k]) && typeof entity[k] === "object")
        .map(k => [k, () =>
            showRelatedEntities(
                joinAttributeToTableName(tableName, k),
                entity[k].id,
                false, false)]);

    const relatedEntityCallbacks = relatedArrayCallbacks.concat(relatedSingleCallbacks);
    const doOpenContextMenu = ev => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY, relatedEntityCallbacks);
    };

    useEffect(() => {
        if (inputEl.current === null) return

        const el = inputEl.current;
        el.focus();

        const cancelOnEsc = ev => {
            if (ev.key === "Escape") stopEditing();
        };

        el.addEventListener("keydown", cancelOnEsc);
        return () => el.removeEventListener("keydown", cancelOnEsc);
    });

    const saveChanges = () => {
        setIsSaving(true);
        saveEntityModifications({...modifications})
            .then(() => {setSaveSuccess(true); syncModifications()})
            .catch(() => setSaveSuccess(false))
            .finally(() => setIsSaving(false));
    };

    // Clear save success after some time
    useEffect(() => {
        if (saveSuccess === null) return;
        const id = setTimeout(() => setSaveSuccess(null), 2000);
        return () => clearTimeout(id);
    }, [saveSuccess]);

    const getCurrentValue = field => {
        const isModified = modifications !== undefined
                         && modifications[field] !== undefined;
        const source = isModified
            ? modifications
            : entity;
        return source[field];
    };

    const getFieldValue = field => {
        const value = getCurrentValue(field);
        const isModified = modifications !== undefined
                         && modifications[field] !== undefined;

        // Always show id for modified related entities
        if (isModified && typeof(value) === "object") {
            return value.id
        }

        return relatedEntityDisplayFields[field] === undefined
            ? formatCellContent(value)
            // If the display field has been defined for the given field, it's a
            // related entity.
            // If the entity doesn't have a related entity, stay blank
            // Otherwise, reach through to the entity and get _that_ value to display
            : value === null || value === undefined
                ? ""
                : value[relatedEntityDisplayFields[field]];
    };

    // Start from the id when editing a related entity, otherwise the current value
    const getInitialEditValue = field => {
        const value = getCurrentValue(field);

        return typeof(value) === "object"
            ? value.id
            : getFieldValue(field);
    };

    const handleFieldClick = (ev, k) => {
        if (commonFields.includes(k)) return;
        ev.stopPropagation();
        startEditing(k);
    };

    return (
        <tr onContextMenu={doOpenContextMenu} class={style.entityRow}>
            <td>
                <RowActions
                    saveSuccess={saveSuccess}
                    isSaving={isSaving}
                    isModified={modifications !== undefined}
                    markedForDeletion={markedForDeletion}
                    saveChanges={saveChanges}
                    revertChanges={revertChanges}
                    markToDelete={markToDelete}
                    cancelDeletion={cancelDeletion}
                />
            </td>
            {headers.map(k =>
                k === editingField
                    ? <td>
                        <input type="text"
                            ref={inputEl}
                            value={getInitialEditValue(k)}
                            class={style.editInput}
                            // Stop propagation to avoid stop editing event bound to
                            // document.onClick
                            onClick={ev => ev.stopPropagation()}
                            onChange={ev => makeEdit(editingField, ev.target.value)} />
                      </td>
                    : <td onClick={ev => handleFieldClick(ev, k)}>
                        <ReadMore
                            text={getFieldValue(k)}
                            maxUnsummarizedLength="70" />
                      </td>
            )}
        </tr>
    );
}

const RowActions = ({
    saveSuccess, isSaving, isModified, markedForDeletion,
    revertChanges, saveChanges, markToDelete, cancelDeletion}) =>
{
    // If just saved, show if successful
    if (saveSuccess !== null) {
        return saveSuccess ? "✔️" : "❌";
    }

    // Currently saving, may succeed or fail
    if (isSaving) {
        return "...";
    }

    let actions = [];

    actions.push(markedForDeletion
        ? { title: "Cancel deletion", ev: cancelDeletion, icon: "🚫"}
        : { title: "Mark for deletion", ev: markToDelete, icon: "🗑"});

    if (isModified) {
        actions.push(
            { title: "Save changes", ev: saveChanges, icon: "💾"});
        actions.push(
            { title: "Revert changes", ev: revertChanges, icon: "↩️"});
    }
    return (<>
        {actions.map(a =>
            <button key={a.title} title={a.title} onClick={a.ev}>{a.icon}</button>)}
    </>);

}

export default EntityRow;
