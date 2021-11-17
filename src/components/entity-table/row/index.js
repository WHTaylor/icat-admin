import {useEffect, useState} from "preact/hooks";

const EntityRow = ({entity, headers, showRelatedEntities, openContextMenu}) => {
    const relatedEntityCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () => showRelatedEntities(entity.id, k.slice(0, -1))]);

    const doOpenContextMenu = ev => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY, relatedEntityCallbacks);
    }

    return (
        <>
            <tr onContextMenu={doOpenContextMenu}>
                {headers.map(k => <td>{entity[k]}</td>)}
            </tr>
        </>
    );
}

export default EntityRow;
