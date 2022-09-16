import {useState, useEffect} from "preact/hooks";

import {lowercaseFirst, tableFilter} from '../../utils.js';
import EntityTable from '../../components/entity-table/container';
import TableList from '../../components/table-list';
import TabWindow from '../../components/tab-window';

const EntityViewer = ({icatClient, visible}) => {
    const [tabFilters, setTabFilters] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    const handleFilterChange = (i, newFilter) =>
        setTabFilters(
            tabFilters.slice(0, i)
                .concat([newFilter])
                .concat(tabFilters.slice(i + 1)));

    const openTab = f => {
        const numTabs = tabFilters.length;
        setTabFilters(tabFilters.concat([f]));
        setActiveTab(numTabs);
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
        // If active tab is the one that got moved, keep it active
        if (activeTab == a) setActiveTab(b);
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
        if (related === null) {
            console.warn("Failed to find related table to open");
            return;
        }
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
        setTabFilters(tabFilters.filter((e, i) => i !== closeIdx));
        if (closeIdx < activeTab) {
            setActiveTab(activeTab - 1);
        } else if (closeIdx === activeTab) {
            if (closeIdx === 0) setActiveTab(null);
            else if (closeIdx === numTabs - 1) setActiveTab(activeTab - 1);
        }
    };

    const toggleSortBy = (i, k, sortAsc) => {
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
    }, [icatClient]);

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
                activeTab={activeTab}
                closeTab={closeTab}
                handleChangeTab={setActiveTab}
                swapTabs={swapTabs}>
                {tabFilters.map((f, i) =>
                    [
                        f.table,
                        f.key,
                        <EntityTable
                            icatClient={icatClient}
                            filter={f}
                            handleFilterChange={f => handleFilterChange(i, f)}
                            openRelated={(e, id, isOneToMany, fromType) =>
                                openRelated(e, f.table, id, isOneToMany, fromType)}
                            toggleSortBy={(k, sortAsc) => toggleSortBy(i, k, sortAsc)}
                            isOpen={i === activeTab}
                            refreshData={() => refreshTab(i)}
                            key={f.key} />
                    ])}
            </TabWindow>
        </div>
    );
}

export default EntityViewer;
