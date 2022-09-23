import style from './style.css';
import {icatAttributeToTableName, joinAttributeToTableName} from '../../utils.js'

const ContextMenu = ({entityType, entity, openRelated, x, y}) => {
    // Related entities which are many-one (ie. investigation.datasets)
    const relatedArrayCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => ({
            entityType: k,
            openRelated: () => openRelated(
                icatAttributeToTableName(entityType, k),
                entity.id,
                true,
                entityType.endsWith("Type"))}));

    // Related entities which are one-many (ie. datafile.dataset)
    const relatedSingleCallbacks = Object.keys(entity)
        .filter(k => !Array.isArray(entity[k]) && typeof entity[k] === "object")
        .map(k => ({
            entityType: k,
            openRelated: () => openRelated(
                joinAttributeToTableName(entityType, k),
                entity[k].id,
                false, false)}));

    const items = relatedArrayCallbacks.concat(relatedSingleCallbacks);
    const content = items.length > 0
        ?  <><h3>Show related</h3>
           <ul class={style.contextMenuList}>
           {items.map(i =>
               <li key={i} class={style.contextMenuRow} onClick={i.openRelated}>
                  {i.entityType}
               </li>)}
            </ul></>
        : <h3>No related entities</h3>;
    return (
        <div class={style.contextMenu} style={{top: y, left: x}}>
            {content}
        </div>
    );
}

export default ContextMenu;
