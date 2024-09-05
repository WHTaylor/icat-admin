import {Dispatch, useEffect, useState} from "preact/hooks";

import IcatClient  from '../../icat';
import {entityNames}  from '../../icatEntityStructure';
import {tableFilter,} from '../../utils';
import EntityTable from '../entity-table/container';
import TabWindow from '../tab-window';
import OpenTabModal from "../open-tab-modal";
import {ConnectionStateAction} from "../../state/connection";
import {useQueries} from "@tanstack/react-query";
import {EntityTabState, OpenTabHandler, TableFilter} from "../../types";
import LeftColumnList from "../left-column-list";

type Props = {
    icatClient: IcatClient
    entityTabs: EntityTabState[];
    activeTabIdx?: number;
    dispatch: Dispatch<ConnectionStateAction>
    key: string;
}

/**
 * EntityBrowser is the root component for viewing entity tables. It represents
 * the main part of the window after logging in to a server.
 *
 * Contains components for opening new tables and a tab selector used to switch
 * between the opened tables.
 */
const EntityBrowser = (
    {
        icatClient,
        entityTabs,
        activeTabIdx,
        dispatch
    }: Props) => {
    const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false);

    const queries = entityTabs.map(et => ({
        queryKey: [icatClient.buildUrl(et.filter)],
        queryFn: async ({signal}: { signal: AbortSignal }) =>
            await icatClient.getEntries(et.filter, signal),
    }));

    const results = useQueries({
        queries
    });

    results.map((res, i) => {
        const {data, error} = res;

        const tab = entityTabs[i]
        if (tab.data !== undefined || tab.errMsg !== undefined) return;

        if (data) {
            dispatch({
                type: "set_data",
                data,
                idx: i
            });
        } else if (error) {
            dispatch({
                type: "set_error",
                message: error.message,
                idx: i
            })
        }
    });

    const openTabForFilter = (f: TableFilter) => {
        dispatch({type: "create_tab", filter: f})
        // Timeout is used as a small hack to make sure scroll happens after component
        // rerenders (or at least, that's what it appears to do).
        setTimeout(() => window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        }), 1);
    };

    const openTab: OpenTabHandler = (entityName, where) =>
        openTabForFilter(tableFilter(entityName, 0, 50, where));

    const swapTabs = (a: number, b: number) => {
        if (a === b) return;
        dispatch({type: "swap", a, b});
    };

    const closeTab = (idx: number) => dispatch({type: "close_tab", idx});

    const deleteEntities = (ids: number[]) => {
        if (activeTabIdx === undefined) return;
        const tab = entityTabs[activeTabIdx];
        if ((tab.deletions ?? new Set()).size === 0) return;

        icatClient.deleteEntities(tab.filter.table, ids)
            .then(() => dispatch({
                type: "sync_deletes", ids, idx: activeTabIdx
            }));
    }
    const insertCreation = async (i: number, id: number) => {
        if (activeTabIdx === undefined) return;

        const activeTab = entityTabs[activeTabIdx];
        const entity = await icatClient.getById(activeTab.filter.table, id);
        dispatch({
            type: "sync_creation", i, entity, idx: activeTabIdx
        });
    }

    const reloadEntity = async (id: number) => {
        if (activeTabIdx === undefined) return;
        const entity = await icatClient.getById(
            entityTabs[activeTabIdx].filter.table, id);
        dispatch({
            type: "sync_modification", entity, idx: activeTabIdx
        });
    };

    useEffect(() => {
        // Could base this on the icat/properties.lifetimeMinutes, but this is simpler
        const twentyMinutes = 1000 * 60 * 20;
        const id = setInterval(() => icatClient.refresh(), twentyMinutes);
        return () => clearInterval(id);
    }, [icatClient]); // eslint-disable-line react-hooks/exhaustive-deps

    // Bind Alt-Shift-O to toggle an OpenTabModal
    useEffect(() => {
        const readKey = (ev: KeyboardEvent) => {
            if (ev.altKey && ev.shiftKey && ev.key == "O") {
                setIsOpenTabModalOpen(!isOpenTabModalOpen)
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [isOpenTabModalOpen])

    return (
        <>
            <LeftColumnList
                title={"ICAT Tables"}
                makeChildren={c => entityNames.map(en =>
                    <li key={en}>
                        <button
                            className={c}
                            onClick={() => openTab(en)}>
                            {en}
                        </button>
                    </li>)}/>

            {entityTabs.length > 0 &&
              <div className="mainContentAndRightColumn">
                <TabWindow
                  activeTabIdx={activeTabIdx}
                  closeTab={closeTab}
                  handleChangeTabIdx={i => dispatch({
                      type: "change_tab",
                      idx: i
                  })}
                  swapTabs={swapTabs}
                  tabs={entityTabs.map(tab =>
                      [tab.filter.table, tab.key])}/>

                  {activeTabIdx !== undefined &&
                    <EntityTable
                      icatClient={icatClient}
                      state={entityTabs[activeTabIdx]}
                      openTab={openTab}
                      insertCreation={insertCreation}
                      reloadEntity={reloadEntity}
                      deleteEntities={deleteEntities}
                      dispatch={a => dispatch({
                          ...a,
                          idx: activeTabIdx
                      })}
                    />
                  }
              </div>
            }

            {isOpenTabModalOpen &&
              <OpenTabModal
                openTab={openTab}
                close={() => setIsOpenTabModalOpen(false)}
              />
            }
        </>
    );
}

export default EntityBrowser;
