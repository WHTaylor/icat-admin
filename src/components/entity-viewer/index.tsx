import {useEffect, useReducer, useState} from "preact/hooks";

import IcatClient, {entityNames,} from '../../icat';
import {tableFilter,} from '../../utils';
import EntityTable from '../entity-table/container';
import TabWindow from '../tab-window';
import style from './style.css';
import OpenTabModal from "../open-tab-modal";
import {simplifyIcatErrMessage} from "../../icatErrorHandling";
import {entityTabReducer} from "../../entityState";
import {useQueries} from "@tanstack/react-query";
import {OpenTabHandler, TableFilter} from "../../types";

type Props = {
    server: string;
    sessionId: string;
    visible: boolean;
    key: string;
}

/**
 * EntityViewer is the root component for viewing entity tables. It represents
 * the main part of the window after logging in to a server.
 *
 * Contains components for opening new tables and a tab selector used to switch
 * between the opened tables.
 */
const EntityViewer = ({server, sessionId, visible}: Props) => {
    const [entityTabs, dispatch] = useReducer(entityTabReducer, [])
    const [activeTabIdx, setActiveTabIdx] = useState<number | null>(null);
    const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false);

    const icatClient = new IcatClient(server, sessionId);

    const queries = entityTabs.map(et => ({
        queryKey: [icatClient.buildUrl(et.filter)],
        queryFn: async () => await icatClient.getEntries(et.filter),
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
                message: simplifyIcatErrMessage(error as string),
                idx: i
            })
        }
    });

    const openTabForFilter = (f: TableFilter) => {
        const numTabs = entityTabs.length;
        dispatch({type: "create_tab", filter: f})
        setActiveTabIdx(numTabs)
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

        if (activeTabIdx === a) setActiveTabIdx(b);
        else if (activeTabIdx === b) setActiveTabIdx(a);
    };

    const closeTab = (idx: number) => {
        if (entityTabs.length === 1 || activeTabIdx === null) {
            setActiveTabIdx(null);
        } else if (idx < activeTabIdx) {
            setActiveTabIdx(activeTabIdx - 1);
        } else if (activeTabIdx === idx) {
            setActiveTabIdx(Math.min(activeTabIdx, entityTabs.length - 2));
        }
        dispatch({type: "close_tab", idx: idx})
    };

    const deleteEntities = (ids: number[]) => {
        if (activeTabIdx === null) return;
        const tab = entityTabs[activeTabIdx];
        if ((tab.deletions ?? new Set()).size === 0) return;

        icatClient.deleteEntities(tab.filter.table, ids)
            .then(() => dispatch({
                type: "sync_deletes", ids, idx: activeTabIdx
            }));
    }
    const insertCreation = async (i: number, id: number) => {
        if (activeTabIdx === null) return;

        const activeTab = entityTabs[activeTabIdx];
        const entity = await icatClient.getById(activeTab.filter.table, id);
        dispatch({
            type: "sync_creation", i, entity, idx: activeTabIdx
        });
    }

    const reloadEntity = async (id: number) => {
        if (activeTabIdx === null) return;
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
    }, [server, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

    // If this is visible, bind Alt-Shift-O to toggle an OpenTabModal
    useEffect(() => {
        if (!visible) return;

        const readKey = (ev: KeyboardEvent) => {
            if (ev.altKey && ev.shiftKey && ev.key == "O") {
                setIsOpenTabModalOpen(!isOpenTabModalOpen)
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [visible, isOpenTabModalOpen])

    return (
        <div class={visible ? "page" : "hidden"}>
            {visible &&
              <>
                <div class="leftColumn">
                  <h2>ICAT tables</h2>
                  <ul className={style.tableList}>
                      {entityNames.map(en =>
                          <li key={en}>
                              <button
                                  className="entityButton"
                                  onClick={() => openTab(en)}>
                                  {en}
                              </button>
                          </li>)}
                  </ul>
                </div>

                  {entityTabs.length > 0 &&
                    <div className="mainContentAndRightColumn">
                      <TabWindow
                        activeTabIdx={activeTabIdx}
                        closeTab={closeTab}
                        handleChangeTabIdx={i => setActiveTabIdx(i)}
                        swapTabs={swapTabs}
                        tabs={entityTabs.map(tab =>
                            [tab.filter.table, tab.key])}/>

                        {activeTabIdx !== null &&
                          <EntityTable
                            icatClient={icatClient}
                            state={entityTabs[activeTabIdx]}
                            openTab={openTab}
                            insertCreation={insertCreation}
                            reloadEntity={reloadEntity}
                            deleteEntities={deleteEntities}
                            dispatch={dispatch}
                              /*
                              TODO: find a way to type capturing idx in dispatch
                                    closure so we don't have to pass it down.
                              */
                            idx={activeTabIdx}
                          />
                        }
                    </div>
                  }
              </>
            }

            {isOpenTabModalOpen &&
              // Even if tab is not visible, have to render this because it
              // holds state we want to persist when on other top level tab
              <OpenTabModal
                openTab={openTab}
                close={() => setIsOpenTabModalOpen(false)}
              />
            }
        </div>
    );
}

export default EntityViewer;
