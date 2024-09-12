import {useMutation} from "@tanstack/react-query";
import SuccessIndicator from "../../success-indicator";
import style from "./style.module.css";
import {EntityModification} from "./index";
import {IcatEntity} from "../../../types";
import {serialize} from "../../../utils";

type ActionButtonData = {
    title: string;
    clickEventHandler: (ev: MouseEvent) => void;
    icon: string;
}

type RowActionsProps = {
    entity: IcatEntity,
    modifications: EntityModification | undefined,
    rowIdx: number;
    saveEntity: (e: IcatEntity) => Promise<number[]>,
    syncChanges: (id: number, rowIdx: number) => void,
    markedForDeletion: boolean,
    revertChanges: (i: number) => void,
    markToDelete: (id: number) => void,
    cancelDeletion: (id: number) => void,
    doDelete: (id: number) => void
}

const RowActions = (
    {
        entity,
        modifications,
        rowIdx,
        saveEntity,
        syncChanges,
        markedForDeletion,
        revertChanges,
        markToDelete,
        cancelDeletion,
        doDelete
    }: RowActionsProps) => {

    const saveMutation = useMutation<number[], Error, void, unknown>({
        mutationFn: () => {
            // If entity.id is undefined, this is a new entity to be created
            // Otherwise we just want to send modifications with the current id
            const e = serialize(entity.id === undefined
                ? entity
                : {...modifications, id: entity.id});
            return saveEntity(e);
        },
        onSuccess: (data) => {
            const isNewEntity = entity.id === undefined;
            syncChanges(isNewEntity ? data[0] : entity.id as number, rowIdx);
        },
    });

    if (!saveMutation.isIdle) {
        return <SuccessIndicator saveState={{
            failed: saveMutation.isError,
            isSaving: saveMutation.isPending,
            clear: saveMutation.reset,
            error: saveMutation.error
        }}/>;
    }

    const actions: ActionButtonData[] = [];
    if (entity.id === undefined) {
        actions.push({title: "Cancel creation", clickEventHandler: () => revertChanges(rowIdx), icon: "🚫"});
        actions.push({
            title: "Create row",
            clickEventHandler: _ => saveMutation.mutate(),
            icon: "💾"
        });
    } else if (markedForDeletion) {
        actions.push({title: "Cancel deletion", clickEventHandler: () => cancelDeletion(entity.id as number), icon: "↩️"});
        actions.push({title: "Confirm deletion", clickEventHandler: () => doDelete(entity.id as number), icon: "✔️"});
    } else {
        actions.push({title: "Mark for deletion", clickEventHandler: () => markToDelete(entity.id as number), icon: "🗑"});
    }

    if (modifications !== undefined) {
        actions.push(
            {title: "Revert changes", clickEventHandler: () => revertChanges(entity.id as number), icon: "↩️"});
        actions.push(
            {
                title: "Save changes",
                clickEventHandler: _ => saveMutation.mutate(),
                icon: "💾"
            });
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

export default RowActions;