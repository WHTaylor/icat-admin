import {useEffect, useState} from "preact/hooks";

function format(cellContent) {
    return cellContent === undefined || cellContent === null
        ? ""
        : cellContent.toString();
}

const EntityRow = ({entity, headers, showRelatedEntities, openContextMenu, rowClass}) => {
    const relatedEntityCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () => showRelatedEntities(entity.id, k.slice(0, -1))]);

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
