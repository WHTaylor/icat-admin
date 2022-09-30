import {useEffect, useState, useRef} from "preact/hooks";
import style from './style.css';

import {parseISODate, commonFields} from '../../../utils.js';
import ReadMore from '../../generic/read-more';
import SuccessIndicator from '../../success-indicator';

function formatCellContent(cellContent) {
    if (cellContent === undefined || cellContent === null) return "";
    if (typeof cellContent === "string") {
        const asDate = parseISODate(cellContent);
        return asDate.isValid()
            ? asDate.format("YYYY-MM-DDTHH:mm:ssZ")
            : cellContent;
    }
    return typeof cellContent === "object"
        ? cellContent.id.toString()
        : cellContent.toString()
}

const EntityRow = ({
    entity, modifications, headers,
    editingField, relatedEntityDisplayFields, markedForDeletion,
    openContextMenu,
    startEditing, stopEditing, makeEdit,
    saveEntity, revertChanges, syncModifications,
    markToDelete, cancelDeletion, doDelete}) =>
{
    const inputEl = useRef(null);
    const [saveState, setSaveState] = useState(null);
    const createSaveState = fields => ({
        ...fields, clear: () => setSaveState(null)
    });

    const doOpenContextMenu = ev => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY, entity);
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
        setSaveState(createSaveState({ isSaving: true }));
        // If entity.id is undefined, this is a new entity to be created
        // Otherwise we just want to send modifications with the current id
        const e = entity.id === undefined
            ? entity
            : {...modifications, id: entity.id};
        const successHandle = entity.id === undefined
            ? res => syncModifications(res[0])
            : syncModifications;
        saveEntity(e)
            .then(successHandle)
            .then(() => setSaveState(createSaveState({
                failed: false, isSaving: false})))
            .catch(err => setSaveState(createSaveState({
                    failed: true, message: err, isSaving: false
                })));
    };

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
        // All entities have some common fields which can't be edited
        if (commonFields.includes(k)) return;
        ev.stopPropagation();
        startEditing(k);
    };

    return (
        <tr onContextMenu={doOpenContextMenu} class={style.entityRow}>
            <td>
                <RowActions
                    isNewRow={entity.id === undefined}
                    saveState={saveState}
                    isModified={modifications !== undefined}
                    markedForDeletion={markedForDeletion}
                    saveChanges={saveChanges}
                    revertChanges={revertChanges}
                    markToDelete={markToDelete}
                    cancelDeletion={cancelDeletion}
                    doDelete={doDelete}
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
                    : <td
                        onClick={ev => handleFieldClick(ev, k)}
                        class={markedForDeletion
                            ? style.markedForDeletion
                            : entity.id === undefined && style.newRow}>
                        <ReadMore text={getFieldValue(k)} />
                      </td>
            )}
        </tr>
    );
}

const RowActions = ({
    isNewRow, saveState, isModified, markedForDeletion,
    revertChanges, saveChanges, markToDelete, cancelDeletion, doDelete}) =>
{
    if (saveState != null) {
        return <SuccessIndicator saveState={saveState} />;
    }

    let actions = [];
    if (isNewRow) {
        actions.push({ title: "Cancel creation", ev: revertChanges, icon: "🚫"});
        actions.push({ title: "Create row", ev: saveChanges, icon: "💾"});
    } else if (markedForDeletion) {
        actions.push({ title: "Cancel deletion", ev: cancelDeletion, icon: "↩️"});
        actions.push({ title: "Confirm deletion", ev: doDelete, icon: "✔️"});
    } else {
        actions.push({ title: "Mark for deletion", ev: markToDelete, icon: "🗑"});
    }

    if (isModified) {
        actions.push(
            { title: "Revert changes", ev: revertChanges, icon: "↩️"});
        actions.push(
            { title: "Save changes", ev: saveChanges, icon: "💾"});
    }
    return (<>
        {actions.map(a =>
            <button
                class={style.actionButton}
                key={a.title}
                title={a.title}
                onClick={a.ev}>
                {a.icon}
            </button>)}
    </>);
}

export default EntityRow;
