import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import {icatAttributeToTableName, joinAttributeToTableName, isDatetime} from '../../../utils.js';

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
    tableName, entity, headers, editingField,
    showRelatedEntities, openContextMenu, startEditing, makeEdit}) => {

    // Pairs of (relatedTable, openFunction) for all relatedTables which are
    // many-one with tableName (ie. investigation -> datasets)
    const relatedArrayCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () =>
            showRelatedEntities(
                icatAttributeToTableName(tableName, k),
                entity.id,
                true)]);

    // Pairs of (relatedTable, openFunction) for all relatedTables which tableName is
    // one-X (ie. datafile -> dataset)
    const relatedSingleCallbacks = Object.keys(entity)
        .filter(k => !Array.isArray(entity[k]) && typeof entity[k] === "object")
        .map(k => [k, () =>
            showRelatedEntities(
                joinAttributeToTableName(tableName, k),
                entity[k].id,
                false)]);

    const relatedEntityCallbacks = relatedArrayCallbacks.concat(relatedSingleCallbacks);
    const doOpenContextMenu = ev => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY, relatedEntityCallbacks);
    }

    return (
        <tr onContextMenu={doOpenContextMenu} class={style.entityRow}>
            {headers.map(k =>
                k === editingField
                    ? <td>
                        <input type="text"
                            value={formatCellContent(entity[k])}
                            onChange={ev => makeEdit(editingField, ev.target.value)} />
                      </td>
                    : <td onClick={() => startEditing(k)}>
                        <ReadMore text={formatCellContent(entity[k])} />
                      </td>
            )}
        </tr>
    );
}

const MAX_UNSUMMARISED_TEXT = 70;
const ReadMore = ({text}) => {
    const [open, setOpen] = useState(false);

    if (text.length - 3 < MAX_UNSUMMARISED_TEXT) return text;
    const shownText = open ? text : text.slice(0, MAX_UNSUMMARISED_TEXT - 3);
    return (
        <>
        {shownText}{!open && "..."}
        <button onClick={() => setOpen(!open)} class={style.readMoreBtn}>
            {open ? "less" : "show more"}
        </button>
        </>
    );
}

export default EntityRow;
