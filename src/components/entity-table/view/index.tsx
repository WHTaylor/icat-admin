import {useEffect, useState} from "preact/hooks";
import {h, Fragment} from "preact";

import style from './style.css';

import EntityRow from '../row';
import ContextMenu, {CtxMenuProps, OpenRelatedHandler} from '../../context-menu';
import {defaultHeaderSort, xToOneAttributeToEntityName} from '../../../utils';
import {IcatEntity, IcatEntityValue} from "../../../icat";
import JSX = h.JSX;

type Props = {
    openRelated: OpenRelatedHandler;
    data: IcatEntity[] | null;
    [k: string]: any;
}

type FieldEdit = {
    // idx will be the index in creations if a new row is being edited,
    // or the entity id if an existing row is being edited
    idx: number | string;
    field: string
};

const EntityTableView = ({
                             data, entityType, sortingBy, deletions, creations,
                             openRelated, setSortingBy, saveEntity, modifyDataRow,
                             markToDelete, cancelDeletion, doDelete,
                             editCreation, cancelCreate, insertCreation
                         }: Props) => {
    const [contextMenuProps, setContextMenuProps] =
        useState<CtxMenuProps | null>(null);
    // Locally saved changes to entities
    const [entityModifications, setEntityModifications] = useState({});
    const [editingNewRow, setEditingNewRow] = useState(false);
    const [fieldBeingEdited, setFieldBeingEdited] =
        useState<FieldEdit | null>(null);
    const stopEditing = () => setFieldBeingEdited(null);
    // Field to show for each related entity in table
    const [relatedDisplayFields, setRelatedDisplayFields] =
        useState<{ [k: string]: string }>({});

    const clearContextMenu = () => setContextMenuProps(null);

    const openContextMenu = (x, y, entity) => {
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

    const editEntity = (id: string, field: string, newValue: IcatEntityValue) => {
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

    const removeModifications = id =>
        setEntityModifications({...entityModifications, [id]: undefined});

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

    const buildEntityRow = (e: IcatEntity, i: number): JSX.Element => {
        const isNewRow = e.id === undefined;
        const makeEdit = (k, v) => {
            const fieldIsEntity = xToOneAttributeToEntityName(entityType, k) !== null;
            const newValue = fieldIsEntity
                // TODO: Validate whether the selected entity exists
                ? {id: Number.parseInt(v)}
                : v;
            isNewRow
                ? editCreation(i, k, newValue)
                : editEntity(e.id, k, newValue);
            stopEditing();
        }
        const syncModifications = isNewRow
            ? async id => await insertCreation(i, id)
            : async () => await modifyDataRow(i, entityModifications[e.id])
                .then(() => removeModifications(e.id));
        const revertChanges = isNewRow
            ? () => cancelCreate(i)
            : () => removeModifications(e.id);
        const isRowBeingEdited =
            fieldBeingEdited != null
            && (editingNewRow
                ? isNewRow && fieldBeingEdited.idx === i
                : !isNewRow && fieldBeingEdited.idx === e.id);

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
            openContextMenu={(x, y) => openContextMenu(x, y, e)}
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
            doDelete={() => doDelete(e.id)}
            markedForDeletion={deletions.has(e.id)}/>;
    };

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
                {creations.concat(data).map((e, i) => buildEntityRow(e, i))}
            </table>
            {contextMenuProps != null && <ContextMenu {...contextMenuProps} />}
        </>
    );
}

export default EntityTableView;