import {useEffect, useState} from "preact/hooks";
import {h} from "preact";

import style from './style.css';

import EntityRow, {EntityModification} from '../row';
import ContextMenu, {CtxMenuProps, OpenRelatedHandler} from '../../context-menu';
import {defaultHeaderSort, xToOneAttributeToEntityName} from '../../../utils';
import {ExistingIcatEntity, NewIcatEntity} from "../../../icat";
import {EntityStateAction} from "../../../entityState";
import JSX = h.JSX;

type Props = {
    openRelated: OpenRelatedHandler;
    data: ExistingIcatEntity[] | null;
    deletions: Set<number>,
    creations: NewIcatEntity[];
    modifications: {[id: number]: EntityModification},
    deleteEntities: (ids: number[]) => void;
    saveEntity: (e: NewIcatEntity | ExistingIcatEntity) => Promise<number[]>;
    cancelCreation: (number) => void;
    reloadEntity: (id: number) => Promise<void>;
    dispatch: (action: EntityStateAction) => void;
    idx: number;
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
                             data, deletions, creations, modifications,
                             entityType, openRelated,
                             sortingBy, saveEntity, reloadEntity,
                             deleteEntities,
                             cancelCreation, insertCreation,
                             dispatch, idx
                         }: Props) => {
    const [contextMenuProps, setContextMenuProps] =
        useState<CtxMenuProps | null>(null);
    // Locally saved changes to entities
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
                ? dispatch({
                    type: "edit_creation", i, k, v: newValue, idx
                })
                : dispatch({
                    type: "edit_entity", id: e.id, k, v, idx
                });
            stopEditing();
        }
        const syncModifications = isNewRow
            ? async id => await insertCreation(i, id)
            : async () => await reloadEntity(e.id);
        const revertChanges = isNewRow
            ? () => cancelCreation(i)
            : () => dispatch({type: "cancel_modifications", id: e.id, idx});
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
            modifications={isNewRow ? undefined : modifications[e.id]}
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
            markToDelete={() => dispatch({type: "mark_delete", id: e.id!, idx})}
            cancelDeletion={() => dispatch({
                type: "cancel_deletes", ids: [e.id!], idx
            })}
            doDelete={() => deleteEntities([(e as ExistingIcatEntity).id])}
            markedForDeletion={deletions.has((e as ExistingIcatEntity).id)}/>;
    };

    const setSortingBy = (field: string, asc: boolean) =>
        dispatch({type: "sort", field, asc, idx});

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