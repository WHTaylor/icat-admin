import {useEffect, useState} from "preact/hooks";
import {h, Fragment} from "preact";

import IcatClient, {
    entityNames,
    ExistingIcatEntity,
    IcatEntityValue, NewIcatEntity
} from '../../icat';
import {
    xToManyAttributeToEntityName, xToOneAttributeToEntityName,
    idReferenceFromRelatedEntity,
    TableFilter,
    tableFilter, EntityTabData, difference, withReplaced
} from '../../utils';
import EntityTable from '../entity-table/container';
import TabWindow from '../tab-window';
import style from './style.css';
import OpenTabModal from "../open-tab-modal";
import {simplifyIcatErrMessage} from "../../icatErrorHandling";
import {EntityModification} from "../entity-table/row";

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
    const [entityTabData, setEntityTabData] = useState<EntityTabData[]>([]);
    const [activeTabIdx, setActiveTabIdx] = useState<number | null>(null);
    const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false);

    const icatClient = new IcatClient(server, sessionId);

    // TODO: Work out if there's a way to make this typesafe
    function changeTabField<T>(
        k: string,
        v: T | ((t: T) => T),
        idx = activeTabIdx) {

        if (idx === null) return;

        const currentTab = entityTabData[idx];
        const newValue = typeof (v) === "function"
            ? (v as (t: T) => T)(currentTab[k])
            : v;

        const newObject = {...entityTabData[idx], [k]: newValue};
        setEntityTabData(withReplaced(entityTabData, newObject, idx));
    }

    const setFilter = (filter: TableFilter) => {
        changeTabField("data", undefined);
        changeTabField("errMsg", undefined);
        changeTabField("filter", filter);
    }

    const setData = (idx: number, entities: ExistingIcatEntity[]) => {
        changeTabField("data", entities, idx);
    }

    const setErrMsg = (idx: number, msg: string) => {
        changeTabField("errMsg", msg, idx);
    }

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        for (let i = 0; i < entityTabData.length; i++) {
            const tableData = entityTabData[i];
            if (tableData.data === undefined) {
                icatClient.getEntries(tableData.filter, signal)
                    .then(d => setData(i, d))
                    .catch(err => {
                        // DOMException gets throws if promise is aborted, which it is
                        // during cleanup `controller.abort()` when table/filter changes
                        // before request finishes
                        if (err instanceof DOMException) return;

                        setErrMsg(i, simplifyIcatErrMessage(err));
                    });
            }
        }
        return () => controller.abort();
    }, [entityTabData]);

    const openTabForFilter = (f: TableFilter) => {
        const numTabs = entityTabData.length;
        setEntityTabData(entityTabData.concat({filter: f}));
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
        else if (a < b) {
            const left = entityTabData.slice(0, a)
            const middle = entityTabData.slice(a + 1, b + 1);
            const right = entityTabData.slice(b + 1);
            setEntityTabData([...left, ...middle, entityTabData[a], ...right]);
        } else {
            const rearranged = [...entityTabData];
            const temp = rearranged[a];
            rearranged[a] = rearranged[b];
            rearranged[b] = temp;
            setEntityTabData(rearranged);
        }
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

    const closeTab = (closeIdx: number) => {
        const numTabs = entityTabData.length;
        setEntityTabData(entityTabData.filter((e, i) => i !== closeIdx));
        if (numTabs === 1 || activeTabIdx === null) {
            setActiveTabIdx(null);
        } else if (closeIdx <= activeTabIdx) {
            const newActiveTab = Math.max(activeTabIdx - 1, 0);
            setActiveTabIdx(newActiveTab);
        }
    };

    const setSortingBy = (k: string, sortAsc: boolean) => {
        if (activeTabIdx === null) return;

        const f = entityTabData[activeTabIdx].filter;
        const newFilter = f.sortField !== k || f.sortAsc !== sortAsc
            ? {...f, sortField: k, sortAsc}
            : f.sortAsc === sortAsc
                ? {...f, sortField: null}
                : {...f, sortAsc};
        setFilter(newFilter);
    };

    const refreshTab = () => changeTabField<TableFilter>(
        "filter", f => ({...f, key: Math.random()}));

    const markToDelete = (idx: number) =>
        changeTabField<Set<number>>("deletions", d => {
            const newDeletions = d ?? new Set();
            newDeletions.add(idx);
            return newDeletions;
        });

    const cancelDeletions = (idxs: number[]) =>
        changeTabField<Set<number>>("deletions", d =>
            difference(d ?? new Set(), new Set(idxs))
        );

    const clearDeletions = () => changeTabField("deletions", undefined);

    const deleteEntities = () => {
        if (activeTabIdx === null) return;

        const {filter, deletions} = entityTabData[activeTabIdx];
        if (deletions === undefined) return;
        const ids = [...deletions];

        icatClient.deleteEntities(filter.table, ids)
            .then(() => {
                changeTabField<ExistingIcatEntity[]>("data", d =>
                    d.filter(e => !ids.includes(e.id)));
            })
            .then(_ => cancelDeletions(ids));
    }

    const addCreation = () => changeTabField<NewIcatEntity[]>("creations", c =>
        (c ?? []).concat({}));

    const clearCreations = () => changeTabField("creations", undefined);

    const editCreation = (i: number, k: string, v: IcatEntityValue) =>
        changeTabField<NewIcatEntity[] | undefined>("creations", c => {
            if (c === undefined) return;
            const changedCreation = {...c[i], [k]: v}
            return withReplaced(c, changedCreation, i);
        })

    const cancelCreation = (i: number) =>
        changeTabField<NewIcatEntity[] | undefined>("creations", c => {
            if (c === undefined || c.length == 1) return undefined;
            return c.slice(0, i).concat(c.slice(i + 1));
        });

    const insertCreation = async (i: number, id: number) => {
        if (activeTabIdx === null) return;

        const activeTab = entityTabData[activeTabIdx];
        const created = await icatClient.getById(activeTab.filter.table, id);
        const withCreated = activeTab.data ?? [];
        withCreated.unshift(created);
        setData(activeTabIdx, withCreated);
        cancelCreation(i);
    }

    const changeData = async (i: number, changes: EntityModification) => {
        if (activeTabIdx === null) return;

        const {data, filter} = entityTabData[activeTabIdx];
        const changed = [...(data || [])];

        // For related entity changes, we need to lookup the new entity in ICAT
        const resolve = async (
            field: string,
            value: string | number | { id: number })
            : Promise<[string, string | number | ExistingIcatEntity]> => {

            if (typeof (value) !== "object") return [field, value];

            const entityType = xToOneAttributeToEntityName(filter.table, field);
            const entity = await icatClient.getById(entityType!, value.id);
            return [field, entity];
        }

        const toResolve = Promise.all(Object.entries(changes)
            .map(([k, v]) => resolve(k, v)));

        await toResolve.then(changes => {
            const changeObj = Object.fromEntries(changes);
            changed[i] = {...changed[i], ...changeObj};
            setData(activeTabIdx, changed);
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

                  {entityTabData.length > 0 &&
                    <div className="mainContentAndRightColumn">
                      <TabWindow
                        activeTabIdx={activeTabIdx}
                        closeTab={closeTab}
                        handleChangeTabIdx={i => setActiveTabIdx(i)}
                        swapTabs={swapTabs}
                        tabFilters={entityTabData.map(ed => ed.filter)}/>

                    {activeTabIdx !== null &&
                      <EntityTable
                        server={server}
                        sessionId={sessionId}
                        state={entityTabData[activeTabIdx]}
                        handleFilterChange={setFilter}
                        openRelated={(attribute, id, isOneToMay) =>
                            openRelated(
                                entityTabData[activeTabIdx].filter.table,
                                attribute,
                                id,
                                isOneToMay)}
                        setSortingBy={setSortingBy}
                        refreshData={refreshTab}
                        markToDelete={markToDelete}
                        cancelDeletions={cancelDeletions}
                        clearDeletions={clearDeletions}
                        deleteEntities={deleteEntities}
                        addCreation={addCreation}
                        editCreation={editCreation}
                        cancelCreation={cancelCreation}
                        clearCreations={clearCreations}
                        insertCreation={insertCreation}
                        changeData={changeData}
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
