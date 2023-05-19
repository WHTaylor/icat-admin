import {StateUpdater, useEffect, useState} from "preact/hooks";
import {h} from "preact";

import IcatClient, {entityNames} from '../../icat';
import {
    xToManyAttributeToEntityName, xToOneAttributeToEntityName,
    idReferenceFromRelatedEntity,
    TableFilter,
    tableFilter
} from '../../utils';
import EntityTable from '../entity-table/container';
import TabWindow from '../tab-window';
import style from './style.css';
import OpenTabModal from "../open-tab-modal";

type Props = {
    server: string;
    sessionId: string;
    visible: boolean;
}
const EntityViewer = ({server, sessionId, visible}: Props) => {
    const [tabFilters, setTabFilters]: [TableFilter[], StateUpdater<TableFilter[]>]
        = useState([]);
    const [activeTabIdx, setActiveTabIdx] = useState<number | null>(null);
    const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false);

    const icatClient = new IcatClient(server, sessionId);

    const handleFilterChange = (i, newFilter) =>
        setTabFilters(
            tabFilters.slice(0, i)
                .concat([newFilter])
                .concat(tabFilters.slice(i + 1)));

    const openTab = (f: TableFilter) => {
        const numTabs = tabFilters.length;
        setTabFilters(tabFilters.concat([f]));
        setActiveTabIdx(numTabs)
        // Timeout is used as a small hack to make sure scroll happens after component
        // rerenders (or at least, that's what it appears to do).
        setTimeout(() => window.scrollTo({top: 0, left: 0, behavior: "smooth"}), 1);
    };

    const swapTabs = (a, b) => {
        if (a === b) return;
        else if (a < b) {
            const left = tabFilters.slice(0, a)
            const middle = tabFilters.slice(a + 1, b + 1);
            const right = tabFilters.slice(b + 1);
            setTabFilters([...left, ...middle, tabFilters[a], ...right]);
        } else {
            const rearranged = [...tabFilters];
            const temp = rearranged[a];
            rearranged[a] = rearranged[b];
            rearranged[b] = temp;
            setTabFilters(rearranged);
        }
    };

    const openRelated = (originEntity: string,
                         attribute: string,
                         originId: string,
                         oneToMany: boolean) => {
        const relatedEntity = oneToMany
            ? xToManyAttributeToEntityName(originEntity, attribute)
            : xToOneAttributeToEntityName(originEntity, attribute);

        if (relatedEntity === null) return;

        const originIdAttribute = idReferenceFromRelatedEntity(
            originEntity, relatedEntity, oneToMany);

        openTab(tableFilter(
            relatedEntity, 0, 50, `${originIdAttribute} = ${originId}`));
    };

    const closeTab = closeIdx => {
        const numTabs = tabFilters.length;
        setTabFilters(tabFilters.filter((e, i) => i !== closeIdx));

        if (activeTabIdx === null) return;
        if (closeIdx < activeTabIdx) {
            setActiveTabIdx(activeTabIdx - 1);
        } else if (numTabs === 1) {
            setActiveTabIdx(null);
        }
    };

    const setSortingBy = (i, k, sortAsc) => {
        const f = tabFilters[i];
        const newFilter = f.sortField !== k || f.sortAsc !== sortAsc
            ? {...f, sortField: k, sortAsc}
            : f.sortAsc === sortAsc
                ? {...f, sortField: null}
                : {...f, sortAsc};
        handleFilterChange(i, newFilter);
    };

    const refreshTab = (i: number) => {
        const f = tabFilters[i];
        const newFilter = {...f, key: Math.random()};
        handleFilterChange(i, newFilter);
    }

    useEffect(() => {
        // Could base this on the icat/properties.lifetimeMinutes, but this is simpler
        const twentyMinutes = 1000 * 60 * 20;
        const id = setInterval(() => icatClient.refresh(), twentyMinutes);
        return () => clearInterval(id);
    }, [server, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

    // If this is visible, bind Alt-Shift-O to toggle an OpenTabModal
    useEffect(() => {
        if (!visible) return;

        const readKey = ev => {
            if (ev.altKey && ev.shiftKey && ev.key == "O") {
                setIsOpenTabModalOpen(!isOpenTabModalOpen)
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [visible, isOpenTabModalOpen])

    return (
        <div class={visible ? "page" : "hidden"}>
            {
                /*
                 We have to always render the TabWindow because rerendering
                 the EntityTables causes them to refetch data. We can get away
                 without rendering the list of entities, however.
                */
                visible &&
                <div class="leftColumn">
                    <h2>ICAT tables</h2>
                    <ul className={style.tableList}>
                        {entityNames.map(en =>
                            <li key={en}>
                                <button
                                    className="entityButton"
                                    onClick={() => openTab(tableFilter(en, 0, 50))}>
                                    {en}
                                </button>
                            </li>)}
                    </ul>
                </div>

                // TODO: Pull EntityTable data up so we don't have to do this
            }
            {
                visible && isOpenTabModalOpen &&
                <OpenTabModal openTab={openTab} close={() => setIsOpenTabModalOpen(false)}></OpenTabModal>
            }
            <TabWindow
                activeTabIdx={activeTabIdx}
                closeTab={closeTab}
                handleChangeTabIdx={i => setActiveTabIdx(i)}
                swapTabs={swapTabs}
                visible={visible}
                entityTables={tabFilters.map((f, i) =>
                    [
                        f,
                        <EntityTable
                            server={server}
                            sessionId={sessionId}
                            filter={f}
                            handleFilterChange={f => handleFilterChange(i, f)}
                            openRelated={(attribute, id, isOneToMany) =>
                                openRelated(f.table, attribute, id, isOneToMany)}
                            setSortingBy={(k, sortAsc) => setSortingBy(i, k, sortAsc)}
                            isOpen={i === activeTabIdx}
                            refreshData={() => refreshTab(i)}
                            key={f.key}/>
                    ])}/>
        </div>
    );
}

export default EntityViewer;
