import {useEffect, useState} from "preact/hooks";
import {h, Fragment} from "preact";

import style from './style.css';

import EntityRow, {EntityModification} from '../row';
import ContextMenu, {CtxMenuProps, OpenRelatedHandler} from '../../context-menu';
import {defaultHeaderSort, xToOneAttributeToEntityName} from '../../../utils';
import {ExistingIcatEntity, IcatEntity, IcatEntityValue, NewIcatEntity} from "../../../icat";
import JSX = h.JSX;

type Props = {
    openRelated: OpenRelatedHandler;
    data: ExistingIcatEntity[] | null;
    creations: NewIcatEntity[];
    deleteEntities: (ids: number[]) => void;
    editCreation: (i: number, k: string, v: IcatEntityValue) => void;
    saveEntity: (e: NewIcatEntity | ExistingIcatEntity) => Promise<number[]>;
    cancelCreation: (number) => void
    reloadEntity: (id: number) => Promise<void>
    [k: string]: any;
}

type FieldEdit = {
    // idx will be the index in creations if a new row is being edited,
    // or the entity id if an existing row is being edited
    idx: number | string;
    field: string
};

/**
 * Displays ICAT entities (data, deletions, and creations) as a table, with
 * each row being rendered as an {@link EntityRow}
 */
const EntityTableView = ({
                             data, entityType, sortingBy, deletions, creations,
                             openRelated, setSortingBy, saveEntity, reloadEntity,
                             markToDelete, cancelDeletion, deleteEntities,
                             editCreation, cancelCreation, insertCreation
                         }: Props) => {
    const [contextMenuProps, setContextMenuProps] =
        useState<CtxMenuProps | null>(null);
    // Locally saved changes to entities
    const [entityModifications, setEntityModifications] =
        useState<{[id: number]: EntityModification }>({});
    const [editingNewRow, setEditingNewRow] = useState(false);
    const [fieldBeingEdited, setFieldBeingEdited] =
        useState<FieldEdit | null>(null);
    const stopEditing = () => setFieldBeingEdited(null);
    // Field to show for each related entity in table
    const [relatedDisplayFields, setRelatedDisplayFields] =
        useState<{ [k: string]: string }>({});

    const clearContextMenu = () => setContextMenuProps(null);

    const openContextMenu = (x: number, y: number, entity: ExistingIcatEntity) => {
        setContextMenuProps({x, y, entity, openRelated});
        stopEditing();
    };

    useEffect(() => {
        const cancelInteractions = () => {
            clearContextMenu();
            stopEditing();
        };
        document.addEventListener("click", cancelInteractions);
        return () => document.removeEventListener("click", cancelInteractions);
    });

    // Note: early returns need to be after all hooks
    if (data === null) return <p>Loading...</p>;
    if (data.length === 0) return <p>No entries</p>;

    const editEntity = (id: number, field: string, newValue: string | number | {id: number}) => {
        const cur = entityModifications[id] === undefined
            ? {}
            : entityModifications[id];
        const originalValue = data.find(e => e.id === id)![field];
        const edited = {...cur, [field]: newValue};
        // If we've modified the value back to the original, remove the modification
        if (newValue === originalValue
            || typeof originalValue === "object" && (originalValue as IcatEntity).id === (newValue as IcatEntity).id) {
            delete edited[field];
        }
        const newModified = {...entityModifications, [id]: edited};
        // If all values have been reverted back to the originals, remove modifications
        if (Object.keys(edited).length === 0) {
            delete newModified[id];
        }
        setEntityModifications(newModified);
    };

    const removeModifications = (id: number) => {
        const newModifications = {...entityModifications};
        delete newModifications[id];
        setEntityModifications(newModifications);
    }

    const dataAttributes = data
        .flatMap(d => Object.keys(d)
            .filter(k => !Array.isArray(d[k])));
    const keys = defaultHeaderSort([...new Set(dataAttributes)]);

    const relatedFieldDisplaySelect = (k: string): JSX.Element => {
        const firstEntityWithValue = data.find(e => e[k] !== undefined);
        if (firstEntityWithValue === undefined) return <></>;

        const fieldValue = firstEntityWithValue[k];
        const fieldValueIsRelatedEntity =
            typeof fieldValue === "object" && !Array.isArray(fieldValue);
        if (!fieldValueIsRelatedEntity) return <></>;

        const setDisplayField = v =>
            setRelatedDisplayFields({...relatedDisplayFields, [k]: v});
        return (<select onChange={ev => setDisplayField((ev.target as HTMLSelectElement).value)}>
            {Object.keys(fieldValue)
                .filter(vk => typeof fieldValue[vk] !== "object")
                .map(vk =>
                    <option
                        key={vk}
                        value={vk}
                        selected={relatedDisplayFields[k] === vk}>{vk}</option>)}
        </select>);
    };

    const buildEntityRow = (e: NewIcatEntity | ExistingIcatEntity, i: number): JSX.Element => {
        const isNewRow = e?.id === undefined;

        const makeEdit = (k: string, v: string | number) => {
            const fieldIsEntity = xToOneAttributeToEntityName(entityType, k) !== null;
            const newValue = fieldIsEntity
                // TODO: Validate whether the selected entity exists
                ? {id: Number.parseInt(v as string)}
                : v;
            isNewRow
                ? editCreation(i, k, newValue)
                : editEntity(e.id, k, newValue);
            stopEditing();
        }
        const syncModifications = isNewRow
            ? async id => await insertCreation(i, id)
            : async () => await reloadEntity(e.id)
                .then(() => removeModifications(e.id));
        const revertChanges = isNewRow
            ? () => cancelCreation(i)
            : () => removeModifications(e.id);
        const isRowBeingEdited =
            fieldBeingEdited != null
            && (editingNewRow
                ? isNewRow && fieldBeingEdited.idx === i
                : !isNewRow && fieldBeingEdited.idx === e.id);

        const openContextMenuAt = isNewRow
            ? (_: number, __: number) => {}
            : (x: number, y: number) => openContextMenu(x, y, e);

        return <EntityRow
            key={isNewRow ? "new-" + i : e.id}
            headers={keys}
            entity={e}
            modifications={isNewRow ? undefined : entityModifications[e.id]}
            editingField={
                isRowBeingEdited
                    ? fieldBeingEdited.field
                    : null}
            relatedEntityDisplayFields={relatedDisplayFields}
            openContextMenu={openContextMenuAt}
            startEditing={field => {
                clearContextMenu();
                setFieldBeingEdited({idx: isNewRow ? i : e.id, field});
                setEditingNewRow(isNewRow);
            }}
            stopEditing={stopEditing}
            makeEdit={makeEdit}
            saveEntity={saveEntity}
            revertChanges={revertChanges}
            syncModifications={syncModifications}
            markToDelete={() => markToDelete(e.id)}
            cancelDeletion={() => cancelDeletion(e.id)}
            doDelete={() => deleteEntities([(e as ExistingIcatEntity).id])}
            markedForDeletion={deletions.has(e.id)}/>;
    };

    // Slightly awkward array combination to make tsc happy
    const empty: (ExistingIcatEntity | NewIcatEntity)[] = [];
    const toDisplay = empty.concat(creations).concat(data);

    return (
        <>
            <table>
                <tr>
                    <th>Actions</th>
                    {keys.map(k =>
                        <th key={k + "-header"}>
                            <div class={style.tableHeaderContainer}>
                            <span class={style.tableHeading}>
                                {k}
                                <span>
                                    <button
                                        className={
                                            `${style.sortButton}
                                            ${sortingBy.field === k && sortingBy.asc
                                                ? style.activeSort : ''}`}
                                        onClick={() => setSortingBy(k, true)}
                                        title={`Sort by ${k}, ascending`}>
                                        ▲
                                    </button>
                                    <button
                                        className={
                                            `${style.sortButton}
                                            ${sortingBy.field === k && !sortingBy.asc
                                                ? style.activeSort : ''}`}
                                        onClick={() => setSortingBy(k, false)}
                                        title={`Sort by ${k}, descending`}>
                                        ▼
                                    </button>
                                </span>
                            </span>
                                {relatedFieldDisplaySelect(k)}
                            </div>
                        </th>)}
                </tr>
                {
                    // Display a row for each creation, then all existing data
                    toDisplay.map((e, i) => buildEntityRow(e, i))
                }
            </table>
            {contextMenuProps != null && <ContextMenu {...contextMenuProps} />}
        </>
    );
}

export default EntityTableView;