import {useMutation} from "@tanstack/react-query";
import SuccessIndicator from "../../success-indicator";
import style from "./style.module.css";
import {EntityModification} from "./index";
import {IcatEntity} from "../../../types";
import {serialize} from "../../../utils";
import {useConnectionStore} from "../../../state/stores";

type ActionButtonData = {
    title: string;
    clickEventHandler: (ev: MouseEvent) => void;
    icon: string;
}

type RowActionsProps = {
    entity: IcatEntity,
    modifications: EntityModification | undefined,
    saveEntity: (e: IcatEntity) => Promise<number[]>,
    syncChanges: (id: number) => void,
    markedForDeletion: boolean,
    revertChanges: () => void,
    doDelete: (id: number) => void
}

const RowActions = (
    {
        entity,
        modifications,
        saveEntity,
        syncChanges,
        markedForDeletion,
        revertChanges,
        doDelete
    }: RowActionsProps) => {
    const markToDelete = useConnectionStore((state) => state.markToDelete);
    const cancelDeletions = useConnectionStore((state) => state.cancelDeletions);

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
            // If this was a create, the new id will be returned in 'data'
            syncChanges(isNewEntity ? data[0] : entity.id as number);
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
        actions.push({title: "Cancel creation", clickEventHandler: revertChanges, icon: "🚫"});
        actions.push({
            title: "Create row",
            clickEventHandler: _ => saveMutation.mutate(),
            icon: "💾"
        });
    } else if (markedForDeletion) {
        actions.push({title: "Cancel deletion", clickEventHandler: () => cancelDeletions([entity.id as number]), icon: "↩️"});
        actions.push({title: "Confirm deletion", clickEventHandler: () => doDelete(entity.id as number), icon: "✔️"});
    } else {
        actions.push({title: "Mark for deletion", clickEventHandler: () => markToDelete(entity.id as number), icon: "🗑"});
    }

    if (modifications !== undefined) {
        actions.push(
            {title: "Revert changes", clickEventHandler: revertChanges, icon: "↩️"});
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