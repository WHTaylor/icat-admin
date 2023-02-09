import style from './style.css';
import {h, Fragment} from "preact";
import {IcatEntity} from "../../icat";

export type OpenRelatedHandler =
    (attribute: string, originId: string, isOneToMany: boolean) => void;

export type CtxMenuProps = {
    x: number;
    y: number;
    entity: IcatEntity;
    openRelated: OpenRelatedHandler;
}
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
            openRelated: () => openRelated(k, (entity[k] as IcatEntity).id, false)
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
