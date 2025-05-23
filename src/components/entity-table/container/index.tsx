import style from './style.module.css';

import IcatClient from '../../../icat';
import EntityTableView from '../view';
import {range} from '../../../utils';
import {useQuery, useQueryClient} from "@tanstack/react-query";
import OnChangeInput from "../../generic/on-change-input";
import {OpenTabHandler, TableFilter} from "../../../types";
import PaginationControl from "../../controls/pagination-control";
import {useConnectionStore} from "../../../state/stores";

type Props = {
    icatClient: IcatClient,
    openTab: OpenTabHandler,
    insertCreation: (i: number, id: number) => Promise<void>;
}

const EntityTable = (
    {
        icatClient,
        openTab,
        insertCreation,
    }: Props) => {
    const errMsg = useConnectionStore((state) => state.getActiveTab()?.errMsg)!;
    const filter = useConnectionStore((state) => state.getActiveTab()?.filter)!;
    const setFilter = useConnectionStore((state) => state.setFilter);
    const showAllColumns = useConnectionStore((state) => state.getActiveTab()?.showAllColumns) || false;
    const toggleShowAllColumns = useConnectionStore((state) => state.toggleShowAllColumns);
    const refresh = useConnectionStore((state) => state.refresh);
    const syncDeletions = useConnectionStore((state) => state.syncDeletions);

    const changeWhere = (w: string) => setFilter({...filter, where: w});
    const changeLimit = (l: number) => setFilter({...filter, limit: l});
    const changePage = (change: number) => {
        const newOffset = Math.max(0, filter.offset + (filter.limit * change));
        if (newOffset === filter.offset) return;
        setFilter({...filter, offset: newOffset});
    };
    const handleSetPage = (n: number) => {
        const newOffset = Math.max(0, filter.limit * (n - 1));
        if (newOffset === filter.offset) return;
        setFilter({...filter, offset: newOffset});
    };
    const pageNumber = Math.floor(filter.offset / filter.limit) + 1;
    const qc = useQueryClient();

    const deleteEntities = (ids: number[]) => {
        icatClient.deleteEntities(filter.table, ids)
            .then(() => syncDeletions(ids));
    }

    return (<>
        <span class={style.tableTitleBar}>
            <h2>{filter.table}</h2>
            <OnChangeInput
                type="text"
                class={style.filterInput}
                value={filter.where || ""}
                placeholder="Filter by (ie. id = 1234)"
                onChange={ev => changeWhere((ev.target as HTMLInputElement).value)}/>
            <button
                title="Refresh data"
                onClick={() => {
                    qc.removeQueries({queryKey: [icatClient, filter]})
                    refresh()
                }}>
                ↻
            </button>
            <PaginationControl
                pageNumber={pageNumber}
                handleSetPage={handleSetPage}
                handleLimitChange={changeLimit}
                handlePageChange={changePage}/>
            <label>
                {/*
                   The label not matching the action/state name here is
                   intentional; from a users point of view, the action is to
                   see all of the columns, but internally the difference is
                   whether we show the empty columns or not
                */}
                Show empty columns
                <input
                    type="checkbox"
                    checked={showAllColumns}
                    defaultChecked={showAllColumns}
                    onChange={toggleShowAllColumns}
                />
            </label>
            <EntityCounter filter={filter} icatClient={icatClient}/>
        </span>

        <span class={style.tableActionsBar}>
            <CreateActions />
            <DeleteActions deleteEntities={deleteEntities}/>
        </span>

        {errMsg !== undefined
            ? <p>{errMsg}</p>
            : <EntityTableView
                entityType={filter.table}
                saveEntity={e =>
                    icatClient.writeEntity(filter.table, e)}
                deleteEntities={deleteEntities}
                insertCreation={insertCreation}
                openTab={openTab}
                icatClient={icatClient}
                showAllColumns={showAllColumns}
            />}
    </>);
}

type DeleteProps = {
    deleteEntities: (ids: number[]) => void;
}
const DeleteActions = ({deleteEntities}: DeleteProps) => {
    const deletions = useConnectionStore((state) => state.getActiveTab()?.deletions)!;
    const cancelDeletions = useConnectionStore((state) => state.cancelDeletions);

    if (deletions.size === 0) return <></>;
    return (
        <span>
            <button onClick={() => deleteEntities([...deletions])}>Delete {deletions.size} rows</button>
            <button onClick={() => cancelDeletions([...deletions])}>Cancel deletions</button>
        </span>);
};

const CreateActions = () => {
    const numCreations = useConnectionStore((state) => state.getActiveTab()?.creations)?.length ?? 0;
    const addCreation = useConnectionStore((state) => state.addCreation);
    const cancelCreations = useConnectionStore((state) => state.cancelCreations);
    return (
        <span>
            <button onClick={addCreation}>Add new</button>
            {numCreations > 0 &&
              <button onClick={() => cancelCreations(range(numCreations))}>
                Cancel creations
              </button>
            }
        </span>);
};

type CounterProps = {
    filter: TableFilter,
    icatClient: IcatClient
}
const EntityCounter = ({filter, icatClient}: CounterProps) => {
    const {isSuccess, data} = useQuery({
        queryKey: [icatClient, filter, 'count'],
        queryFn: async ({signal}) => await icatClient.getCount(filter, signal)
    });

    return isSuccess
        ? <p class={style.tableTitleCount}>{data} matches</p>
        : <></>;
}

export default EntityTable;
