import {useEffect, useState} from "preact/hooks";

import ContextMenu from '../context-menu';

const EntityRow = ({entity, headers, contextMenuFilter}) => {
    const [contextMenuPos, setContextMenuPos] = useState(null);
    const relatedEntityCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () => contextMenuFilter(entity.id, k.slice(0, -1))]);

    const showContextMenu = ev => {
        ev.preventDefault();
        const pos = [ev.pageX, ev.pageY];
        setContextMenuPos(pos);
    };


    return (
        <>
            <tr onContextMenu={showContextMenu}>
                {headers.map(k => <td>{entity[k]}</td>)}
            </tr>
            {contextMenuPos &&
                <ContextMenu pos={contextMenuPos} items={relatedEntityCallbacks} />}
        </>
    );
}

export default EntityRow;
