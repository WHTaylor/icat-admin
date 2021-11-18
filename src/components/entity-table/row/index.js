import {useEffect, useState} from "preact/hooks";

import {icatAttributeToTableName} from '../../../utils.js';

function format(cellContent) {
    return cellContent === undefined || cellContent === null
        ? ""
        : cellContent.toString();
}

const EntityRow = ({entity, headers, showRelatedEntities, openContextMenu, rowClass}) => {
    const relatedEntityCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () => showRelatedEntities(icatAttributeToTableName(k), entity.id)]);

    const doOpenContextMenu = ev => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY, relatedEntityCallbacks);
    }

    return (
        <tr onContextMenu={doOpenContextMenu} class={rowClass}>
            {headers.map(k => <td>{format(entity[k])}</td>)}
        </tr>
    );
}

export default EntityRow;
