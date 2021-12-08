import {useEffect, useState, useRef} from "preact/hooks";
import style from './style.css';

import {icatAttributeToTableName, joinAttributeToTableName, isDatetime} from '../../../utils.js';
import ReadMore from '../../generic/read-more';

function formatCellContent(cellContent) {
    if (cellContent === undefined || cellContent === null) return "";

    return typeof cellContent !== "string"
        ? (typeof cellContent === "object"
            ? cellContent.id.toString()
            : cellContent.toString())
        : isDatetime(cellContent)
            ? new Date(cellContent).toLocaleString()
            : cellContent;
}

const EntityRow = ({
    tableName, entity, modifications, headers, editingField,
    showRelatedEntities, openContextMenu,
    startEditing, stopEditing, makeEdit, saveModifiedEntity, revertChanges}) =>
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
        saveModifiedEntity({...modifications})
            .then(() => setSaveSuccess(true))
            .catch(() => setSaveSuccess(false))
            .finally(() => setIsSaving(false));
    };

    // If the entity has been modified, show save and revert buttons
    const editedActions = <>
            <button title="Revert changes" onClick={revertChanges}>↩️</button>
            <button title="Save changes" onClick={saveChanges}>💾</button>
        </>;
    const savingActions = "🙃";
        // check ✔️
    const curEntityValue = field => {
        const v = modifications === undefined || modifications[field] === undefined
            ? entity[field]
            : modifications[field];
        return formatCellContent(v);
    }
    return (
        <tr onContextMenu={doOpenContextMenu} class={style.entityRow}>
            <td>
                {modifications === undefined
                    ? ""
                    : isSaving
                        ? savingActions
                        : editedActions}
            </td>
            {headers.map(k =>
                k === editingField
                    ? <td>
                        <input type="text"
                            ref={inputEl}
                            value={curEntityValue(k)}
                            onChange={ev => makeEdit(editingField, ev.target.value)} />
                      </td>
                    : <td onClick={() => startEditing(k)}>
                        <ReadMore
                            text={curEntityValue(k)}
                            maxUnsummarizedLength="70" />
                      </td>
            )}
        </tr>
    );
}

export default EntityRow;
