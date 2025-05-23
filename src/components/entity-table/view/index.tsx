import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import {h} from "preact";

import style from './style.module.css';

import EntityRow, {EntityModification} from '../row';
import ContextMenu, {CtxMenuDynamicProps} from '../../context-menu';
import {defaultHeaderSort} from '../../../utils';
import {
    ExistingIcatEntity,
    IcatEntity,
    NewIcatEntity,
    OpenTabHandler,
    TableIcatEntityValue
} from "../../../types";
import IcatClient, {getEntityAttributes} from "../../../icat";
import LoadingIndicator from "../../generic/loading-indicator";
import {entityStructures, IcatEntityName} from "../../../icatEntityStructure";
import {useConnectionStore} from "../../../state/stores";
import JSX = h.JSX;

type Props = {
    entityType: IcatEntityName,
    deleteEntities: (ids: number[]) => void;
    saveEntity: (e: NewIcatEntity | ExistingIcatEntity) => Promise<number[]>;
    insertCreation: (rowIdx: number, id: number) => Promise<void>;
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
                             entityType,
                             saveEntity,
                             deleteEntities,
                             insertCreation,
                             openTab, icatClient,
                             showAllColumns
                         }: Props) => {
    const data = useConnectionStore((state) => state.getActiveTab()?.data);
    const creations = useConnectionStore((state) => state.getActiveTab()?.creations) ?? [];
    const modifications = useConnectionStore((state) => state.getActiveTab()?.modifications) ?? {};
    const filter = useConnectionStore((state) => state.getActiveTab()?.filter)!;
    const deletions = useConnectionStore((state) => state.getActiveTab()?.deletions)!;
    const cancelCreations = useConnectionStore((state) => state.cancelCreations);
    const editCreation = useConnectionStore((state) => state.editCreation);
    const cancelModifications = useConnectionStore((state) => state.cancelModifications);
    const syncModifications = useConnectionStore((state) => state.syncModifications);
    const editEntity = useConnectionStore((state) => state.editEntity);

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

    const clearContextMenu = useCallback(
        () => setContextMenuProps(null),
        [setContextMenuProps]
    );

    const startEditing = useCallback(
        (field: string, rowIdx: number) => {
            clearContextMenu();
            setFieldBeingEdited({rowIdx, field});
        },
        [clearContextMenu, setFieldBeingEdited]
    );
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

    useEffect(() => {
        const stopEditingOnEsc = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") stopEditing();
        };

        document.addEventListener("keydown", stopEditingOnEsc);
        return () => document.removeEventListener("keydown", stopEditingOnEsc)
    }, [stopEditing]);

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

    const modifyCreation = useCallback(
        (k: string, v: TableIcatEntityValue, i: number) => editCreation(i, k, v),
        [editCreation]
    );
    const modifyEntity = useCallback(
        (k: string, v: TableIcatEntityValue, id: number) => editEntity(id, k, v),
        [editEntity]
    );
    const wrapModifier = useCallback(
        (f: (k: string, v: TableIcatEntityValue, i: number) => void) =>
            (k: string, v: TableIcatEntityValue, i: number) => {
                const fieldIsEntity = !getEntityAttributes(entityType).includes(k)
                const newValue = fieldIsEntity
                    // TODO: Validate whether the selected entity exists
                    ? {id: Number.parseInt(v as string)}
                    : v;
                f(k, newValue, i);
                stopEditing();
            },
        [entityType, stopEditing]
    );

    const doModifyCreation = useMemo(
        () => wrapModifier(modifyCreation),
        [wrapModifier, modifyCreation]
    );
    const doModifyEntity = useMemo(
        () => wrapModifier(modifyEntity),
        [wrapModifier, modifyEntity]
    );

    const syncCreation = useCallback(
        (id: number, rowIdx: number) => insertCreation(rowIdx, id),
        [insertCreation]
    );
    const doDelete = useCallback(
        (id: number) => deleteEntities([id]),
        [deleteEntities]
    );


    // Note: early returns need to be after all hooks
    if (data === undefined) return <LoadingIndicator/>;

    // For fields which are objects (AKA X to one related entities), display
    // a dropdown that allows the user to select which field from those entities
    // to display
    const relatedFieldDisplaySelect = (k: string): JSX.Element => {
        const firstEntityWithValue = data?.find(e => e[k] !== undefined);
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
        return buildRow(
            e,
            rowIdx,
            "new-entity-" + rowIdx,
            undefined,
            (id: number) => syncCreation(id, rowIdx),
            () => cancelCreations([rowIdx]),
            doModifyCreation,
            undefined,
        );
    }

    const reloadEntity = async (id: number) => {
        const entity = await icatClient.getById(filter.table, id);
        syncModifications(entity);
    };

    const buildExistingRow = (e: ExistingIcatEntity, rowIdx: number) => {
        return buildRow(
            e,
            rowIdx,
            e.id.toString(),
            modifications[e.id],
            reloadEntity,
            () => cancelModifications(e.id),
            doModifyEntity,
            openContextMenu,
        );
    }

    const buildRow = (
        e: NewIcatEntity | ExistingIcatEntity,
        rowIdx: number,
        key: string,
        modifications: EntityModification | undefined,
        syncModifications: (id: number) => void,
        revertChanges: () => void,
        makeEdit: (k: string,
                   v: TableIcatEntityValue,
                   i: number) => void,
        openContextMenu?: (x: number, y: number, e: IcatEntity) => void,
    ) => <EntityRow
        key={key}
        entity={e}
        modifications={modifications}
        rowIdx={rowIdx}
        headers={keys}
        editingField={fieldBeingEdited != null && fieldBeingEdited.rowIdx === rowIdx
            ? fieldBeingEdited.field
            : null}
        relatedEntityDisplayFields={relatedDisplayFields}
        markedForDeletion={e.id !== undefined && deletions.has(e.id)}
        openContextMenu={openContextMenu}
        startEditing={startEditing}
        makeEdit={makeEdit}
        saveEntity={saveEntity}
        syncChanges={syncModifications}
        revertChanges={revertChanges}
        doDelete={doDelete}
    />;

    const somethingToDisplay = creations.length > 0 || (data?.length ?? 0) > 0;

    return !(somethingToDisplay || showAllColumns)
        ? <p>No entries</p>
        : <>
            <table>
                <TableHeader
                    keys={keys}
                    relatedFieldDisplaySelect={relatedFieldDisplaySelect}
                />
                {
                    somethingToDisplay && <tbody>
                    {
                        creations.map(buildCreationRow)
                            .concat(data?.map((e, i) =>
                                buildExistingRow(e, i + creations.length)) ?? [])
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
    relatedFieldDisplaySelect: (k: string) => JSX.Element
}

const TableHeader = ({
                         keys,
                         relatedFieldDisplaySelect
                     }: TableHeaderProps) => {
    const sortField = useConnectionStore((state) => state.getActiveTab()?.filter.sortField);
    const sortAsc = useConnectionStore((state) => state.getActiveTab()?.filter.sortAsc);
    const setSortingBy = useConnectionStore((state) => state.setSortingBy);

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
                                    ${sortField === k && sortAsc
                                        ? style.activeSort : ''}`}
                                onClick={() => setSortingBy(k, true)}
                                title={`Sort by ${k}, ascending`}>
                                ▲
                            </button>
                            <button
                                className={
                                    `${style.sortButton}
                                    ${sortField === k && !sortAsc
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
