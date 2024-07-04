import style from './style.module.css';
import {ExistingIcatEntity, OpenTabHandler} from "../../types";
import {
    idReferenceFromRelatedEntity,
    tableFilter,
    xToManyAttributeToEntityName,
    xToOneAttributeToEntityName
} from "../../utils";
import IcatClient from "../../icat";
import {useQueries} from "@tanstack/react-query";

export type CtxMenuDynamicProps = {
    x: number;
    y: number;
    entity: ExistingIcatEntity;
}

export type CtxMenuProps = CtxMenuDynamicProps & {
    entityType: string,
    openTab: OpenTabHandler,
    icatClient: IcatClient
}

/**
 * ContextMenu is displayed when right clicking an {@link EntityRow}, and
 * gives options for displaying any entities linked to the selected one
 */
const ContextMenu = ({
                         entity,
                         entityType,
                         x,
                         y,
                         openTab,
                         icatClient
                     }: CtxMenuProps) => {
    const relatedEntityArrays = Object.keys(entity)
        .filter(k => Array.isArray(entity[k]));

    /**
     * For a field which refers to a related entity type, get the name of the
     * table that field refers to, and a 'where' filter that will only return
     * entities from that table that are related to this entity.
     *
     * @param field the name of a field on the entity which refers to another type
     * of entity
     */
    const relatedEntityFilterComponents = (field: string) => {
        // This is currently a correct way of working out whether the related
        // entity is an 1-many or many-1 relationship for all fields on all
        // entities, as of ICAT 6.
        const oneToMany = field.endsWith("s")
            || field.includes("jobs");
        const referenceId = oneToMany
            ? entity.id
            : (entity[field] as ExistingIcatEntity).id;
        const relatedEntityType = oneToMany
            ? xToManyAttributeToEntityName(entityType, field)
            : xToOneAttributeToEntityName(entityType, field);

        if (relatedEntityType === null) return;

        // The id field on the related entity that is used to filter to _only_ the
        // related entity/entities.
        // For one to many, this is ie. 'investigation.id'
        // ie. For many to one
        const idFilterField = idReferenceFromRelatedEntity(
            entityType, relatedEntityType, oneToMany);

        return [relatedEntityType, `${idFilterField} = ${referenceId}`];
    }

    // For each one-many relationship, fetch how many related entities there are
    const arrayCountQueries = relatedEntityArrays.map(k => {
        const filterComponents = relatedEntityFilterComponents(k);
        if (!filterComponents) {
            console.warn(`Unknown relationship ${k}`);
            return {
                // Little hack to ensure we don't ever use the cached non-result
                queryKey: [Math.random().toString()],
                queryFn: async () => 0
            };
        }

        const [relatedEntity, where] = filterComponents;
        const f = tableFilter(relatedEntity, 0, 0, where)

        return {
            queryKey: [icatClient.buildUrl(f)],
            queryFn: async ({signal}: { signal: AbortSignal }) =>
                await icatClient.getCount(f, signal),
        }
    });

    const arrayRelationshipCountQueries = useQueries({
        queries: arrayCountQueries
    });

    const arrayRelationshipCounts = arrayRelationshipCountQueries.map(res => {
        const {data,} = res;
        return data || null;
    });

    const openRelated = (field: string) => {
        const filterComponents = relatedEntityFilterComponents(field);
        if (!filterComponents) {
            console.warn(`Unknown relationship ${field}`);
            return;
        }
        const [relatedEntity, where] = filterComponents;
        openTab(relatedEntity, where);
    };

    // Related entities which are many-one (ie. investigation.datasets)
    const relatedArrayCallbacks = relatedEntityArrays
        .map((k, i) => ({
            relatedEntityType: k,
            count: arrayRelationshipCounts[i] || 0,
            onClick: () => openRelated(k)
        }));

    // Related entities which are one-many (ie. datafile.dataset)
    const relatedSingleCallbacks = Object.keys(entity)
        .filter(k => !Array.isArray(entity[k]) && typeof entity[k] === "object")
        .map(k => ({
            relatedEntityType: k,
            count: 1,
            onClick: () => openRelated(k)
        }));

    const items = relatedArrayCallbacks.concat(relatedSingleCallbacks);
    const content = items.length > 0
        ? <><h3>Show related</h3>
            <ul class={style.contextMenuList}>
                {items.map(i =>
                    <li key={i.relatedEntityType}
                        class={style.contextMenuRow}
                        onClick={i.onClick}>
                        {i.relatedEntityType}
                        {i.count !== null &&
                          <span class={style.relatedEntityCount}>
                            ({i.count})
                          </span>
                        }
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
