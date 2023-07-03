import {useEffect, useReducer, useState} from "preact/hooks";
import {h, Fragment} from "preact";

import IcatClient, {entityNames,} from '../../icat';
import {
    xToManyAttributeToEntityName, xToOneAttributeToEntityName,
    idReferenceFromRelatedEntity,
    TableFilter,
    tableFilter,
} from '../../utils';
import EntityTable from '../entity-table/container';
import TabWindow from '../tab-window';
import style from './style.css';
import OpenTabModal from "../open-tab-modal";
import {simplifyIcatErrMessage} from "../../icatErrorHandling";
import {entityTabReducer} from "../../entityData";

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

    // Fetch data for the first tab which hasn't loaded its data yet
    // TODO: load everything in parallel without being interrupted by rendering
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        for (let i = 0; i < entityTabs.length; i++) {
            const tableData = entityTabs[i];
            if (tableData.data === undefined && tableData.errMsg === undefined) {
                icatClient.getEntries(tableData.filter, signal)
                    .then(data => dispatch({type: "set_data", data, idx: i}))
                    .catch(err => {
                        // DOMException gets throws if promise is aborted, which it is
                        // during cleanup `controller.abort()` when table/filter changes
                        // before request finishes
                        if (err instanceof DOMException) return;

                        dispatch({
                            type: "set_error",
                            message: simplifyIcatErrMessage(err),
                            idx: i
                        })
                    });
                break;
            }
        }
        return () => controller.abort();
    });

    const openTabForFilter = (f: TableFilter) => {
        const numTabs = entityTabs.length;
        dispatch({type: "create", filter: f})
        setActiveTabIdx(numTabs)
        // Timeout is used as a small hack to make sure scroll happens after component
        // rerenders (or at least, that's what it appears to do).
        setTimeout(() => window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        }), 1);
    };

    const openTab = (entityName: string, where: string | null = null) =>
        openTabForFilter(tableFilter(entityName, 0, 50, where));

    const swapTabs = (a: number, b: number) => {
        if (a === b) return;
        dispatch({type: "swap", a, b});

        if (activeTabIdx === a) setActiveTabIdx(b);
        else if (activeTabIdx === b) setActiveTabIdx(a);
    };

    const openRelated = (originEntity: string,
                         attribute: string,
                         originId: number,
                         oneToMany: boolean) => {
        const relatedEntity = oneToMany
            ? xToManyAttributeToEntityName(originEntity, attribute)
            : xToOneAttributeToEntityName(originEntity, attribute);

        if (relatedEntity === null) return;

        const originIdAttribute = idReferenceFromRelatedEntity(
            originEntity, relatedEntity, oneToMany);

        openTab(relatedEntity, `${originIdAttribute} = ${originId}`);
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

    const cancelDeletions = (ids: number[]) =>
        dispatchEdit("cancel_delete", {ids});

    const deleteEntities = ids => {
        if (activeTabIdx === null) return;
        const tab = entityTabs[activeTabIdx];
        if ((tab.deletions ?? new Set()).size === 0) return;

        icatClient.deleteEntities(tab.filter.table, ids)
            .then(() => dispatchEdit("sync_delete", {ids}));
    }
    const insertCreation = async (i: number, id: number) => {
        if (activeTabIdx === null) return;

        const activeTab = entityTabs[activeTabIdx];
        const entity = await icatClient.getById(activeTab.filter.table, id);
        dispatchEdit("sync_creation", {i, entity});
    }

    const reloadEntity = async (id: number) => {
        if (activeTabIdx === null) return;
        const entity = await icatClient.getById(
            entityTabs[activeTabIdx].filter.table, id);
        dispatchEdit("sync_modification", {entity});
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

    function dispatchEdit(type, args = {}) {
        if (activeTabIdx === null) return;
        dispatch({
            type,
            idx: activeTabIdx,
            ...args
        });
    }

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
                        tabFilters={entityTabs.map(tab => tab.filter)}/>

                        {activeTabIdx !== null &&
                          <EntityTable
                            server={server}
                            sessionId={sessionId}
                            state={entityTabs[activeTabIdx]}
                            openRelated={(attribute, id, isOneToMay) =>
                                openRelated(
                                    entityTabs[activeTabIdx].filter.table,
                                    attribute,
                                    id,
                                    isOneToMay)}
                            handleFilterChange={filter =>
                                dispatchEdit("edit_filter", {filter})}
                            setSortingBy={(field, asc) =>
                                dispatchEdit("sort", {field, asc})}
                            refreshData={() => dispatchEdit("refresh")}
                            markToDelete={id => dispatchEdit("mark_delete", {id})}
                            cancelDeletions={cancelDeletions}
                            deleteEntities={deleteEntities}
                            addCreation={() => dispatchEdit("add_creation")}
                            editCreation={(i, k, v) =>
                                dispatchEdit("edit_creation", {i, k, v})}
                            cancelCreations={
                                idxs => dispatchEdit("cancel_creations", {idxs})}
                            insertCreation={insertCreation}
                            reloadEntity={reloadEntity}
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
