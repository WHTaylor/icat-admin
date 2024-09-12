import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import {h} from "preact";

import style from './style.module.css';

import EntityRow, {EntityModification} from '../row';
import ContextMenu, {CtxMenuDynamicProps} from '../../context-menu';
import {defaultHeaderSort} from '../../../utils';
import {
    ExistingIcatEntity,
    IcatEntity,
    IcatEntityValue,
    NewIcatEntity,
    OpenTabHandler
} from "../../../types";
import {EntityDataAction} from "../../../state/connection";
import IcatClient, {getEntityAttributes} from "../../../icat";
import LoadingIndicator from "../../generic/loading-indicator";
import {entityStructures} from "../../../icatEntityStructure";
import RowActions from "../row/actions";
import JSX = h.JSX;

type Props = {
    data?: ExistingIcatEntity[];
    deletions: Set<number>,
    creations: NewIcatEntity[];
    modifications: { [id: number]: EntityModification },
    entityType: string,
    sortingBy: { field: string | null, asc: boolean | null },
    deleteEntities: (ids: number[]) => void;
    saveEntity: (e: NewIcatEntity | ExistingIcatEntity) => Promise<number[]>;
    cancelCreation: (i: number) => void;
    insertCreation: (rowIdx: number, id: number) => Promise<void>;
    reloadEntity: (id: number) => Promise<void>;
    dispatch: (action: EntityDataAction) => void;
    openTab: OpenTabHandler,
    icatClient: IcatClient,
    showAllColumns: boolean,
}

type FieldEdit = {
    rowIdx: number
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
    const [fieldBeingEdited, setFieldBeingEdited] =
        useState<FieldEdit | null>(null);
    const stopEditing = useCallback(
        () => setFieldBeingEdited(null),
        [setFieldBeingEdited]
    );
    // Field to show for each related entity in table
    const [relatedDisplayFields, setRelatedDisplayFields] =
        useState<{ [k: string]: string }>({});

    const clearContextMenu = () => setContextMenuProps(null);

    const openContextMenu = useCallback((x: number, y: number, e: IcatEntity) => {
        setContextMenuProps({x, y, entity: e});
        stopEditing();
    }, [setContextMenuProps, stopEditing]);

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

    const keys = useMemo(
        () => {
            const fields = showAllColumns
                // If 'Show empty columns' is checked, display all fields and x-to-one
                // relationships of entityType in the table.
                ? entityStructures[entityType].attributes
                    .concat(entityStructures[entityType].ones.map(o => o.name))

                // Otherwise, only show columns where at least one of the values for it in
                // data is populated
                : (data ?? []).flatMap(d => Object.keys(d)
                    .filter(k => !Array.isArray(d[k])));
            return defaultHeaderSort([...new Set(fields)]);
        },
        [showAllColumns, data, entityType]);

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

    const buildCreationRow = (e: NewIcatEntity, rowIdx: number) => {
        const makeModification = (k: string, v: IcatEntityValue) => dispatch({
            type: "edit_creation", i: rowIdx, k, v
        });
        const revertChanges = () => cancelCreation(rowIdx);

        return buildRow(
            e,
            rowIdx,
            "new-entity-" + rowIdx,
            undefined,
            id => insertCreation(rowIdx, id),
            revertChanges,
            noContextMenu,
            makeModification,
        );
    }

    const buildExistingRow = (e: ExistingIcatEntity, rowIdx: number) => {
        const makeModification = (k: string, v: string | number | ExistingIcatEntity) =>
            dispatch({
                type: "edit_entity", id: e.id, k, v
            });
        const revertChanges = () => dispatch({
            type: "cancel_modifications",
            id: e.id
        });
        return buildRow(
            e,
            rowIdx,
            e.id.toString(),
            modifications[e.id],
            id => reloadEntity(id),
            revertChanges,
            openContextMenu,
            makeModification,
        );
    }

    const buildRow = (
        e: NewIcatEntity | ExistingIcatEntity,
        rowIdx: number,
        key: string,
        modifications: EntityModification | undefined,
        syncModifications: (id: number) => void,
        revertChanges: () => void,
        openContextMenu: (x: number, y: number, e: IcatEntity) => void,
        makeModification: (k: string, v: string | number | ExistingIcatEntity) => void,
    ) => {
        const makeEdit = (k: string, v: string) => {
            const fieldIsEntity = !getEntityAttributes(entityType).includes(k)
            const newValue = fieldIsEntity
                // TODO: Validate whether the selected entity exists
                ? {id: Number.parseInt(v as string)}
                : v;
            makeModification(k, newValue)
            stopEditing();
        };

        const actions = <RowActions
            entity={e}
            modifications={modifications}
            saveEntity={saveEntity}
            syncChanges={syncModifications}
            markedForDeletion={e.id !== undefined && deletions.has(e.id)}
            revertChanges={revertChanges}
            markToDelete={() => dispatch({type: "mark_delete", id: e.id!})}
            cancelDeletion={() => dispatch({
                type: "cancel_deletes", ids: [e.id!]
            })}
            doDelete={() => deleteEntities([(e as ExistingIcatEntity).id])}
        />;

        return <EntityRow
            key={key}
            headers={keys}
            entity={e}
            actions={actions}
            modifications={modifications}
            editingField={fieldBeingEdited != null && fieldBeingEdited.rowIdx === rowIdx
                ? fieldBeingEdited.field
                : null}
            relatedEntityDisplayFields={relatedDisplayFields}
            openContextMenu={openContextMenu}
            startEditing={(field: string) => {
                clearContextMenu();
                setFieldBeingEdited({rowIdx, field});
            }}
            stopEditing={stopEditing}
            makeEdit={makeEdit}

            markedForDeletion={e.id !== undefined && deletions.has(e.id)}
        />;
    };

    const somethingToDisplay = creations.length > 0 || data.length > 0;

    return !(somethingToDisplay || showAllColumns)
        ? <p>No entries</p>
        : <>
            <table>
                <TableHeader
                    keys={keys}
                    sortingBy={sortingBy}
                    setSortingBy={(field, asc) => dispatch({
                        type: "sort", field, asc
                    })}
                    relatedFieldDisplaySelect={relatedFieldDisplaySelect}
                />
                {
                    somethingToDisplay && <tbody>
                    {
                        creations.map(buildCreationRow)
                            .concat(data.map((e, i) =>
                                buildExistingRow(e, i + creations.length)))
                    }
                  </tbody>
                }
            </table>

            {contextMenuProps != null &&
              <ContextMenu {...contextMenuProps}
                           entityType={entityType}
                           openTab={openTab}
                           icatClient={icatClient}
              />}
        </>;
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
    return <thead>
    <tr>
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
    </thead>
}

export default EntityTableView;

function noContextMenu(_: number, __: number, ___: IcatEntity) {
}
