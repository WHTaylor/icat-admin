import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import {icatAttributeToTableName} from '../../../utils.js';

function format(cellContent) {
    return cellContent === undefined || cellContent === null
        ? ""
        : <ReadMore text={cellContent.toString()}/>;
}

const EntityRow = ({tableName, entity, headers, showRelatedEntities, openContextMenu}) => {
    const relatedEntityCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () =>
            showRelatedEntities(
                icatAttributeToTableName(tableName, k), entity.id)]);

    const doOpenContextMenu = ev => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY, relatedEntityCallbacks);
    }

    return (
        <tr onContextMenu={doOpenContextMenu} class={style.entityRow}>
            {headers.map(k => <td>{format(entity[k])}</td>)}
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
