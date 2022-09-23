import style from './style.css';
import {icatAttributeToTableName, joinAttributeToTableName} from '../../utils.js'

const ContextMenu = ({entityType, entity, showRelatedEntities, x, y}) => {
    // Pairs of (relatedTable, openFunction) for all relatedTables which are
    // many-one with tableName (ie. investigation -> datasets)
    const relatedArrayCallbacks = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]))
        .map(k => [k, () =>
            showRelatedEntities(
                icatAttributeToTableName(entityType, k),
                entity.id,
                true,
                entityType.endsWith("Type"))]);

    // Pairs of (relatedTable, openFunction) for all relatedTables which entityType is
    // one-X (ie. datafile -> dataset)
    const relatedSingleCallbacks = Object.keys(entity)
        .filter(k => !Array.isArray(entity[k]) && typeof entity[k] === "object")
        .map(k => [k, () =>
            showRelatedEntities(
                joinAttributeToTableName(entityType, k),
                entity[k].id,
                false, false)]);

    const items = relatedArrayCallbacks.concat(relatedSingleCallbacks);
    const content = items.length > 0
        ?  <><h3>Show related</h3>
           <ul class={style.contextMenuList}>
           {items.map(i =>
               <li key={i} class={style.contextMenuRow} onClick={i[1]}>{i[0]}</li>)}
            </ul></>
        : <h3>No related entities</h3>;
    return (
        <div class={style.contextMenu} style={{top: y, left: x}}>
            {content}
        </div>
    );
}

export default ContextMenu;
