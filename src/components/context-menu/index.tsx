import style from './style.css';
import {ExistingIcatEntity, OpenTabHandler} from "../../types";
import {
    idReferenceFromRelatedEntity,
    xToManyAttributeToEntityName,
    xToOneAttributeToEntityName
} from "../../utils";

export type CtxMenuDynamicProps = {
    x: number;
    y: number;
    entity: ExistingIcatEntity;
}

export type CtxMenuProps = CtxMenuDynamicProps & {
    entityType: string,
    openTab: OpenTabHandler,
}

/**
 * ContextMenu is displayed when right clicking an {@link EntityRow}, and
 * gives options for displaying any entities linked to the selected one
 */
const ContextMenu = ({entity, entityType, openTab, x, y}: CtxMenuProps) => {
    const openRelated = (attribute: string,
                         originId: number,
                         oneToMany: boolean) => {
        const relatedEntity = oneToMany
            ? xToManyAttributeToEntityName(entityType, attribute)
            : xToOneAttributeToEntityName(entityType, attribute);

        if (relatedEntity === null) return;

        const originIdAttribute = idReferenceFromRelatedEntity(
            entityType, relatedEntity, oneToMany);

        openTab(relatedEntity, `${originIdAttribute} = ${originId}`);
    };

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
            openRelated: () => openRelated(
                k, (entity[k] as ExistingIcatEntity).id, false)
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
