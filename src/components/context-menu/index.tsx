import style from './style.css';
import {h, Fragment} from "preact";
import {ExistingIcatEntity} from "../../icat";

export type OpenRelatedHandler =
    (attribute: string, originId: number, isOneToMany: boolean) => void;

export type CtxMenuProps = {
    x: number;
    y: number;
    entity: ExistingIcatEntity;
    openRelated: OpenRelatedHandler;
}

/**
 * ContextMenu is displayed when right clicking an {@link EntityRow}, and
 * gives options for displaying any entities linked to the selected one
 */
const ContextMenu = ({entity, openRelated, x, y}: CtxMenuProps) => {
    // Related entities which are many-one (ie. investigation.datasets)
    const relatedArrayCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => ({
            relatedEntityType: k,
            openRelated: () => openRelated(k, entity.id, true)
        }));

    // Related entities which are one-many (ie. datafile.dataset)
    const relatedSingleCallbacks = Object.keys(entity)
        .filter(k => !Array.isArray(entity[k]) && typeof entity[k] === "object")
        .map(k => ({
            relatedEntityType: k,
            openRelated: () => openRelated(k, (entity[k] as ExistingIcatEntity).id, false)
        }));

    const items = relatedArrayCallbacks.concat(relatedSingleCallbacks);
    const content = items.length > 0
        ? <><h3>Show related</h3>
            <ul class={style.contextMenuList}>
                {items.map(i =>
                    <li key={i.relatedEntityType}
                        class={style.contextMenuRow}
                        onClick={i.openRelated}>
                        {i.relatedEntityType}
                    </li>)}
            </ul>
        </>
        : <h3>No related entities</h3>;

    return (
        <div class={style.contextMenu} style={{top: y, left: x}}>
            {content}
        </div>
    );
}

export default ContextMenu;
