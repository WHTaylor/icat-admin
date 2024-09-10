import {useEffect, useRef} from "preact/hooks";

import style from './style.module.css';

import {commonFields, serialize} from '../../../utils';
import ReadMore from '../../generic/read-more';
import SuccessIndicator from '../../success-indicator';
import {ExistingIcatEntity, IcatEntityValue, NewIcatEntity} from "../../../types";
import {
    inIcatFormat,
    parseDate,
} from "../../../dateUtils";
import OnChangeInput from "../../generic/on-change-input";
import {useMutation, UseMutationResult} from "@tanstack/react-query";

function formatCellContent(cellContent: IcatEntityValue | undefined | null)
    : string {
    if (cellContent === undefined || cellContent === null) return "";
    if (typeof cellContent === "string") {
        const asDate = parseDate(cellContent);
        return asDate.isValid()
            ? inIcatFormat(asDate)
            : cellContent;
    }
    return typeof cellContent === "object"
        ? (cellContent as ExistingIcatEntity).id.toString()
        : cellContent.toString()
}

/**
 * Represents changes made to an entity, as {fieldName: newValue}
 *
 * Values can be either a literal, or an object with an entity ID to link to a
 * related entity.
 */
export type EntityModification = {
    [k: string]: string | number | { id: number }
}

type Props = {
    entity: ExistingIcatEntity | NewIcatEntity;
    modifications?: EntityModification;
    headers: string[];
    editingField: string | null;
    relatedEntityDisplayFields: { [k: string]: string };
    saveEntity: (e: NewIcatEntity | ExistingIcatEntity) => Promise<number[]>;
    [k: string]: any;
}

/**
 * Renders a single entity as a table row, and provides controls for editing
 * the entity
 */
const EntityRow = (
    {
        entity,
        modifications,
        headers,
        editingField,
        relatedEntityDisplayFields,
        markedForDeletion,
        openContextMenu,
        startEditing,
        stopEditing,
        makeEdit,
        saveEntity,
        revertChanges,
        syncModifications,
        markToDelete,
        cancelDeletion,
        doDelete
    }: Props) => {

    const inputEl = useRef<HTMLInputElement>(null);

    const doOpenContextMenu = (ev: MouseEvent) => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY);
    };

    useEffect(() => {
        if (inputEl.current === null) return;

        const el = inputEl.current;
        el.focus();

        const cancelOnEsc = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") stopEditing();
        };

        el.addEventListener("keydown", cancelOnEsc);
        return () => el.removeEventListener("keydown", cancelOnEsc);
    });

    const isNewRow = entity.id === undefined;

    const mutation = useMutation({
        mutationFn: () => {
            // If entity.id is undefined, this is a new entity to be created
            // Otherwise we just want to send modifications with the current id
            const e = serialize(isNewRow
                ? entity
                : {...modifications, id: entity.id});
            return saveEntity(e);
        },
        onSuccess: (data) => {
            const id = isNewRow ? data : entity.id;
            syncModifications(id);
        },
    });

    const getCurrentValue = (field: string): IcatEntityValue => {
        const isModified = modifications !== undefined
            && modifications[field] !== undefined;
        const source = isModified
            ? modifications
            : entity;
        return source[field];
    };

    const getFieldValue = (field: string): string => {
        const value = getCurrentValue(field);
        if (value === null || value === undefined) return "";

        const isModified = modifications !== undefined
            && modifications[field] !== undefined;

        // Always show id for new and modified related entities, because
        // we won't have any other fields for them until changes are saved
        if (typeof (value) === "object" && (isNewRow || isModified)) {
            return (value as ExistingIcatEntity).id.toString();
        }

        if (relatedEntityDisplayFields[field] === undefined) {
            return formatCellContent(value);
        }

        // By this point, the value cannot be a string or number, because
        // relatedEntityDisplayFields will never be set for those fields,
        // and array fields are never displayed in the table
        const relatedEntity = value as ExistingIcatEntity;
        const fieldToDisplay = relatedEntityDisplayFields[field];
        return relatedEntity[fieldToDisplay] as string;
    };

    // Start from the id when editing a related entity, otherwise the current value
    const getInitialEditValue = (field: string): string => {
        const value = getCurrentValue(field);

        return typeof (value) === "object"
            ? (value as ExistingIcatEntity).id.toString()
            : getFieldValue(field);
    };

    const handleFieldClick = (ev: MouseEvent, k: string) => {
        // All entities have some common fields which can't be edited
        if (commonFields.includes(k)) return;
        ev.stopPropagation();
        startEditing(k);
    };

    const getStyleForField = (k: string): string | undefined => {
        if (markedForDeletion) return style.markedForDeletion;
        if (isNewRow) return style.newRow
        if (modifications && k in modifications) return style.modified;
    }

    return (
        <tr onContextMenu={doOpenContextMenu} class={style.entityRow}>
            <td>
                <RowActions
                    isNewRow={isNewRow}
                    isModified={modifications !== undefined}
                    markedForDeletion={markedForDeletion}
                    mutation={mutation}
                    revertChanges={revertChanges}
                    markToDelete={markToDelete}
                    cancelDeletion={cancelDeletion}
                    doDelete={doDelete}
                />
            </td>
            {headers.map(k =>
                k === editingField
                    ? <td key={k}>
                        <OnChangeInput
                            type="text"
                            ref={inputEl}
                            value={getInitialEditValue(k)}
                            class={style.editInput}
                            onChange={ev => makeEdit(editingField, (ev.target as HTMLInputElement).value)}/>
                    </td>
                    : <td
                        key={k}
                        onClick={ev => handleFieldClick(ev, k)}
                        class={getStyleForField(k)}>
                        <ReadMore text={getFieldValue(k)}/>
                    </td>
            )}
        </tr>
    );
}

type ActionButtonData = {
    title: string;
    clickEventHandler: (ev: MouseEvent) => void;
    icon: string;
}

type RowActionsProps = {
    mutation: UseMutationResult<number[], Error, void, unknown>,
    isNewRow: boolean,
    isModified: boolean,
    markedForDeletion: boolean,
    revertChanges: () => void,
    markToDelete: () => void,
    cancelDeletion: () => void,
    doDelete: () => void
}

const RowActions = (
    {
        mutation,
        isNewRow,
        isModified,
        markedForDeletion,
        revertChanges,
        markToDelete,
        cancelDeletion,
        doDelete
    }: RowActionsProps) => {
    if (!mutation.isIdle) {
        return <SuccessIndicator saveState={{
            failed: mutation.isError,
            isSaving: mutation.isPending,
            clear: mutation.reset,
            error: mutation.error
        }}/>;
    }

    const actions: ActionButtonData[] = [];
    if (isNewRow) {
        actions.push({title: "Cancel creation", clickEventHandler: revertChanges, icon: "🚫"});
        actions.push({title: "Create row", clickEventHandler: _ => mutation.mutate(), icon: "💾"});
    } else if (markedForDeletion) {
        actions.push({title: "Cancel deletion", clickEventHandler: cancelDeletion, icon: "↩️"});
        actions.push({title: "Confirm deletion", clickEventHandler: doDelete, icon: "✔️"});
    } else {
        actions.push({title: "Mark for deletion", clickEventHandler: markToDelete, icon: "🗑"});
    }

    if (isModified) {
        actions.push(
            {title: "Revert changes", clickEventHandler: revertChanges, icon: "↩️"});
        actions.push(
            {title: "Save changes", clickEventHandler: _ => mutation.mutate(), icon: "💾"});
    }
    return (<>
        {actions.map(a =>
            <button
                class={style.actionButton}
                key={a.title}
                title={a.title}
                onClick={a.clickEventHandler}>
                {a.icon}
            </button>)}
    </>);
}

export default EntityRow;
