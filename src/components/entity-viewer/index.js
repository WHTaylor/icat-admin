import {useState, useEffect} from "preact/hooks";
import { route } from 'preact-router';

import IcatClient from '../../icat.js';
import {lowercaseFirst, tableFilter, encodedSearchParams} from '../../utils.js';
import EntityTable from '../entity-table/container';
import TableList from '../table-list';
import TabWindow from '../tab-window';

function getActiveFilterIdx(filters, activeFilter) {
    if (activeFilter === null) return null;
    const idx = filters.findIndex(f =>
        f.table == activeFilter.table
            && f.where == activeFilter.where
            && f.offset.toString() == activeFilter.offset
            && f.limit.toString() == activeFilter.limit);
    return idx < 0 ? null : idx;
}

const EntityViewer = ({server, sessionId, visible, activeFilter}) => {
    const [tabFilters, setTabFilters] = useState([]);
    const icatClient = new IcatClient(server, sessionId);

    const routeToNewFilter = f => {
        const params = new URLSearchParams(window.location.search);
        if (f === null) {
            params.delete("table");
            params.delete("where");
            params.delete("offset");
            params.delete("limit");
        } else {
            for (const k of ["table", "where", "offset", "limit"]) {
                if (f[k] != null) {
                    params.set(k, f[k]);
                } else {
                    params.delete(k);
                }
            }
        }
        route(window.location.pathname + "?" + encodedSearchParams(params));
    };

    const handleFilterChange = (i, newFilter) => {
        setTabFilters(
            tabFilters.slice(0, i)
                .concat([newFilter])
                .concat(tabFilters.slice(i + 1)));
        routeToNewFilter(newFilter);
    }

    const openTab = f => {
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

    /* related    - the table to open
     * origin     - the table we're coming from
     * relationId - the id used in the where filter of the new table
     *              If the origin-related entity is one-many, this is the id of the
     *              entity in the origin table, otherwise it's the id of the related
     *              entity
     * oneToMany  - true if related-origin is one-many, otherwise false
     */
    const openRelated = (related, origin, relationId, oneToMany, fromType) => {
        // This happens if no matching table is found in joinAttributeToTableName
        if (related === null) return;

        // TODO: Document what fromType is (because I've forgotten)
        const searchFor = fromType
            ? "type.id"
            : oneToMany
                ? `${lowercaseFirst(origin)}.id`
                :"id";
        openTab(tableFilter(related, 0, 50, `${searchFor} = ${relationId}`));
    }

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
            ? {...f, sortField: k, sortAsc }
            : f.sortAsc === sortAsc
                ? {...f, sortField: null}
                : {...f, sortAsc};
        handleFilterChange(i, newFilter);
    };

    const refreshTab = i => {
        const f = tabFilters[i];
        const newFilter= {...f, key: Math.random()};
        handleFilterChange(i, newFilter);
    }

    useEffect(() => {
        // Could base this on the icat/properties.lifetimeMinutes, but this is simpler
        const twentyMinutes = 1000 * 60 * 20;
        const id = setInterval(() => icatClient.refresh(), twentyMinutes);
        return () => clearInterval(id);
    }, [server, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

    const activeTabIdx = getActiveFilterIdx(tabFilters, activeFilter);
    return (
        <div class={visible ? "page" : "hidden"}>
            { /*
                Only render the TableList if visible.
                This is because TableList binds a keydown event we only want for
                the active server.
            */}
            {visible && <div class="leftColumn">
                <TableList openTab={openTab} />
            </div>}
            <TabWindow
                activeTabIdx={activeTabIdx}
                closeTab={closeTab}
                handleChangeTabIdx={i => routeToNewFilter(tabFilters[i])}
                swapTabs={swapTabs}>
                {tabFilters.map((f, i) =>
                    [
                        f.table,
                        f.key,
                        <EntityTable
                            server={server}
                            sessionId={sessionId}
                            filter={f}
                            handleFilterChange={f => handleFilterChange(i, f)}
                            openRelated={(e, id, isOneToMany, fromType) =>
                                openRelated(e, f.table, id, isOneToMany, fromType)}
                            setSortingBy={(k, sortAsc) => setSortingBy(i, k, sortAsc)}
                            isOpen={i === activeTabIdx}
                            refreshData={() => refreshTab(i)}
                            key={f.key} />
                    ])}
            </TabWindow>
        </div>
    );
}

export default EntityViewer;
