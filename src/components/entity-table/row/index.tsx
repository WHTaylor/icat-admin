import {useEffect, useRef} from "preact/hooks";

import style from './style.module.css';

import {commonFields} from '../../../utils';
import ReadMore from '../../generic/read-more';
import {
    ExistingIcatEntity,
    IcatEntity,
    IcatEntityValue,
    NewIcatEntity,
    TableIcatEntityValue
} from "../../../types";
import {inIcatFormat, parseDate,} from "../../../dateUtils";
import OnChangeInput from "../../generic/on-change-input";
import {JSX} from "preact";

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
    [k: string]: TableIcatEntityValue
}

type Props = {
    entity: ExistingIcatEntity | NewIcatEntity;
    modifications?: EntityModification;
    rowIdx: number;
    headers: string[];
    editingField: string | null;
    relatedEntityDisplayFields: { [k: string]: string };
    markedForDeletion: boolean;
    openContextMenu: (x: number, y: number, e: IcatEntity) => void;
    startEditing: (k: string, i: number) => void;
    stopEditing: () => void;
    makeEdit: (k: string, v: string, i: number) => void;
    actions: JSX.Element;
}

/**
 * Renders a single entity as a table row, and provides controls for editing
 * the entity
 */
const EntityRow = (
    {
        entity,
        modifications,
        rowIdx,
        headers,
        editingField,
        relatedEntityDisplayFields,
        markedForDeletion,
        openContextMenu,
        startEditing,
        stopEditing,
        makeEdit,
        actions
    }: Props) => {

    const inputEl = useRef<HTMLInputElement>(null);

    const doOpenContextMenu = (ev: MouseEvent) => {
        ev.preventDefault();
        openContextMenu(ev.pageX, ev.pageY, entity);
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
        startEditing(k, rowIdx);
    };

    const getStyleForField = (k: string): string | undefined => {
        if (markedForDeletion) return style.markedForDeletion;
        if (isNewRow) return style.newRow
        if (modifications && k in modifications) return style.modified;
    }

    return (
        <tr onContextMenu={doOpenContextMenu} class={style.entityRow}>
            <td>
                {actions}
            </td>
            {headers.map(k =>
                k === editingField
                    ? <td key={k}>
                        <OnChangeInput
                            type="text"
                            ref={inputEl}
                            value={getInitialEditValue(k)}
                            class={style.editInput}
                            onChange={ev => makeEdit(
                                editingField,
                                (ev.target as HTMLInputElement).value,
                                isNewRow ? rowIdx : entity.id)
                            }/>
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
export default EntityRow;
