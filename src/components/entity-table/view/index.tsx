import {useEffect, useState} from "preact/hooks";
import {h} from "preact";

import style from './style.module.css';

import EntityRow, {EntityModification} from '../row';
import ContextMenu, {CtxMenuDynamicProps} from '../../context-menu';
import {defaultHeaderSort} from '../../../utils';
import {ExistingIcatEntity, NewIcatEntity, OpenTabHandler} from "../../../types";
import {EntityDataAction} from "../../../state/connection";
import IcatClient, {getEntityAttributes} from "../../../icat";
import JSX = h.JSX;
import LoadingIndicator from "../../generic/loading-indicator";
import {entityStructures} from "../../../icatEntityStructure";

type Props = {
    data?: ExistingIcatEntity[];
    deletions: Set<number>,
    creations: NewIcatEntity[];
    modifications: {[id: number]: EntityModification},
    entityType: string,
    sortingBy: {field: string | null, asc: boolean | null},
    deleteEntities: (ids: number[]) => void;
    saveEntity: (e: NewIcatEntity | ExistingIcatEntity) => Promise<number[]>;
    cancelCreation: (i: number) => void;
    reloadEntity: (id: number) => Promise<void>;
    dispatch: (action: EntityDataAction) => void;
    openTab: OpenTabHandler,
    icatClient: IcatClient,
    showAllColumns: boolean,
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
                             entityType,
                             sortingBy, saveEntity, reloadEntity,
                             deleteEntities,
                             cancelCreation, insertCreation,
                             dispatch,
                             openTab, icatClient,
                             showAllColumns
                         }: Props) => {
    const [contextMenuProps, setContextMenuProps] =
        useState<CtxMenuDynamicProps | null>(null);
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
        setContextMenuProps({x, y, entity});
        stopEditing();
    };

    // Set up event listener to close the context menu and stop editing when
    // clicking away
    useEffect(() => {
        const cancelInteractions = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement;
            if (!target) return;

            // Allow clicks on fields being edited to work normally
            if (target.tagName == "INPUT") return;

            ev.stopPropagation();
            clearContextMenu();
            stopEditing();
        };
        document.addEventListener("click", cancelInteractions);
        return () => document.removeEventListener("click", cancelInteractions);
    });

    // Note: early returns need to be after all hooks
    if (data === undefined) return <LoadingIndicator/>;

    // For fields which are objects (AKA X to one related entities), display
    // a dropdown that allows the user to select which field from those entities
    // to display
    const relatedFieldDisplaySelect = (k: string): JSX.Element => {
        const firstEntityWithValue = data.find(e => e[k] !== undefined);
        if (firstEntityWithValue === undefined) return <></>;

        const fieldValue = firstEntityWithValue[k];
        const fieldValueIsRelatedEntity =
            typeof fieldValue === "object" && !Array.isArray(fieldValue);
        if (!fieldValueIsRelatedEntity) return <></>;

        const setDisplayField = (v: string) =>
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

    // If 'Show empty columns' is checked, display all fields and x-to-one
    // relationships of entityType in the table.
    // Otherwise, only show columns where at least one of the values for it in
    // data is populated
    const fields = showAllColumns
        ? entityStructures[entityType].fields
            .concat(entityStructures[entityType].ones.map(o => o.name))
        : data.flatMap(d => Object.keys(d)
            .filter(k => !Array.isArray(d[k])));
    const keys = defaultHeaderSort([...new Set(fields)]);

    const buildEntityRow = (e: NewIcatEntity | ExistingIcatEntity, i: number): JSX.Element => {
        const isNewRow = e?.id === undefined;

        const makeEdit = (k: string, v: string | number) => {
            const fieldIsEntity = !getEntityAttributes(entityType).includes(k)
            const newValue = fieldIsEntity
                // TODO: Validate whether the selected entity exists
                ? {id: Number.parseInt(v as string)}
                : v;
            isNewRow
                ? dispatch({
                    type: "edit_creation", i, k, v: newValue
                })
                : dispatch({
                    type: "edit_entity", id: e.id, k, v: newValue
                });
            stopEditing();
        }
        const syncModifications = isNewRow
            ? async (id: number) => await insertCreation(i, id)
            : async () => await reloadEntity(e.id);
        const revertChanges = isNewRow
            ? () => cancelCreation(i)
            : () => dispatch({type: "cancel_modifications", id: e.id});
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
            startEditing={(field: string) => {
                clearContextMenu();
                setFieldBeingEdited({idx: isNewRow ? i : e.id, field});
                setEditingNewRow(isNewRow);
            }}
            stopEditing={stopEditing}
            makeEdit={makeEdit}
            saveEntity={saveEntity}
            revertChanges={revertChanges}
            syncModifications={syncModifications}
            markToDelete={() => dispatch({type: "mark_delete", id: e.id!})}
            cancelDeletion={() => dispatch({
                type: "cancel_deletes", ids: [e.id!]
            })}
            doDelete={() => deleteEntities([(e as ExistingIcatEntity).id])}
            markedForDeletion={deletions.has((e as ExistingIcatEntity).id)}/>;
    };

    // Slightly awkward array combination to make tsc happy
    const empty: (ExistingIcatEntity | NewIcatEntity)[] = [];
    const toDisplay = empty.concat(creations).concat(data);

    return (
        <>
            <table>
                {
                    (toDisplay.length > 0 || showAllColumns)
                    && <TableHeader
                    keys={keys}
                    sortingBy={sortingBy}
                    setSortingBy={(field, asc) => dispatch({
                        type: "sort", field, asc
                    })}
                    relatedFieldDisplaySelect={relatedFieldDisplaySelect}
                  />
                }
                {
                    toDisplay.length === 0
                        ? <p>No entries</p>
                        // Display a row for each creation, then all existing data
                        : toDisplay.map((e, i) => buildEntityRow(e, i))
                }
            </table>
            {contextMenuProps != null &&
              <ContextMenu {...contextMenuProps}
                           entityType={entityType}
                           openTab={openTab}
                           icatClient={icatClient}
              />}
        </>
    );
}

type TableHeaderProps = {
    keys: string[],
    sortingBy: { field: string | null, asc: boolean | null },
    setSortingBy: (field: string, asc: boolean) => void,
    relatedFieldDisplaySelect: (k: string) => JSX.Element
}

const TableHeader = ({
                         keys,
                         sortingBy,
                         setSortingBy,
                         relatedFieldDisplaySelect
                     }: TableHeaderProps) => {
    return <tr>
        <th>Actions</th>
        {keys.map(k =>
            <th key={k + "-header"}>
                <div className={style.tableHeaderContainer}>
                    <span className={style.tableHeading}>
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
            </th>
        )}
    </tr>
}

export default EntityTableView;
