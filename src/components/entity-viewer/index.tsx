import {StateUpdater, useEffect, useState} from "preact/hooks";
import {route} from 'preact-router';
import {h} from "preact";

import IcatClient from '../../icat';
import {
    assignKey,
    xToManyAttributeToEntityName, xToOneAttributeToEntityName,
    idReferenceFromRelatedEntity,
    TableFilter,
    tableFilter
} from '../../utils';
import EntityTable from '../entity-table/container';
import TableList from '../table-list';
import TabWindow from '../tab-window';
import {mergeFilterIntoParams, parseUrlParams, urlSearchParamsToObj} from '../../routing';

function getActiveFilterIdx(filters: TableFilter[], activeFilter): number | null {
    if (activeFilter === null) return null;
    const idx = filters.findIndex(f =>
        f.table == activeFilter.table
        && f.where == activeFilter.where
        && f.offset?.toString() == activeFilter.offset
        && f.limit?.toString() == activeFilter.limit
        && f.sortField == activeFilter.sortField
        && f.sortAsc?.toString() == activeFilter.sortAsc);
    return idx < 0 ? null : idx;
}

type Props = {
    server: string;
    sessionId: string;
    visible: boolean;
}
const EntityViewer = ({server, sessionId, visible}: Props) => {
    const [tabFilters, setTabFilters]: [TableFilter[], StateUpdater<TableFilter[]>]
        = useState([]);

    const [_, activeFilter] = parseUrlParams(urlSearchParamsToObj(new URLSearchParams(window.location.search)));
    const activeTabIdx = getActiveFilterIdx(tabFilters, activeFilter);

    // If we've been given a filter that doesn't have a tab yet, create it
    // This happens when opening a filter directly from a URL
    if (visible && activeFilter != null && activeTabIdx === null) {
        setTabFilters(tabFilters.concat([assignKey(activeFilter)]));
    }

    const icatClient = new IcatClient(server, sessionId);

    const routeToNewFilter = (f: TableFilter) => {
        const params = new URLSearchParams(window.location.search);
        route(window.location.pathname + "?" + mergeFilterIntoParams(params, f));
    };

    const handleFilterChange = (i, newFilter) => {
        setTabFilters(
            tabFilters.slice(0, i)
                .concat([newFilter])
                .concat(tabFilters.slice(i + 1)));
        routeToNewFilter(newFilter);
    }

    const openTab = (f: TableFilter) => {
        setTabFilters(tabFilters.concat([f]));
        routeToNewFilter(f);
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
        const activeTabIdx = getActiveFilterIdx(tabFilters, activeFilter);
        setTabFilters(tabFilters.filter((e, i) => i !== closeIdx));
        if (closeIdx === activeTabIdx) {
            var newActiveFilter;
            if (numTabs === 1) {
                newActiveFilter = null;
            } else if (closeIdx === numTabs - 1) {
                newActiveFilter = tabFilters[numTabs - 2];
            } else {
                newActiveFilter = tabFilters[closeIdx + 1];
            }
            routeToNewFilter(newActiveFilter);
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

    return (
        <div class={visible ? "page" : "hidden"}>
            { /*
                Only render the TableList if visible.
                This is because TableList binds a keydown event we only want for
                the active server.
            */}
            {visible && <div class="leftColumn">
                <TableList openTab={openTab}/>
            </div>}
            <TabWindow
                activeTabIdx={activeTabIdx}
                closeTab={closeTab}
                handleChangeTabIdx={i => routeToNewFilter(tabFilters[i])}
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
