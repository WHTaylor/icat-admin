import {useState, useEffect} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import {lowercaseFirst, tableFilter} from '../../utils.js';
import EntityTable from '../../components/entity-table/container';
import TabWindow from '../../components/tab-window';

const EntityViewer = ({icatClient, sessionId}) => {
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
    };

    /* related    - the table to open
     * origin     - the table we're coming from
     * relationId - the id used in the where filter of the new table
     *              If the origin-related entity is one-many, this is the id of the
     *              entity in the origin table, otherwise it's the id of the related
     *              entity
     * oneToMany  - true if related-origin is one-many, otherwise false
     */
    const openRelated = (related, origin, relationId, oneToMany) => {
        const where = oneToMany
            ? `${lowercaseFirst(origin)}.id = ${relationId}`
            : `id = ${relationId}`;
        openTab(tableFilter(related, 0, 50, where));
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

    const changeSortField = (i, k) => {
        const f = tabFilters[i];
        const newFilter = f.sortField !== k
            ? {...f, sortField: k, sortAsc: true }
            : f.sortAsc
                ? {...f, sortAsc: false}
                : {...f, sortField: null};
        handleFilterChange(i, newFilter);
    };

    useEffect(() => {
        // Could base this on the icat/properties.lifetimeMinutes, but this is simpler
        const twentyMinutes = 1000 * 60 * 20;
        const id = setInterval(() => icatClient.refresh(sessionId), twentyMinutes);
        return () => clearInterval(id);
    }, [icatClient, sessionId]);

    return (
        <>
        <div class="leftColumn">
            <h2>ICAT tables</h2>
            <ul>
                {entityNames.map(en =>
                    <li>
                        <button onClick={() => openTab(tableFilter(en, 0, 50))}>
                            {en}
                        </button>
                    </li>)}
            </ul>
        </div>
        <TabWindow
            class={style.asdf}
            activeTab={activeTab}
            closeTab={closeTab}
            handleChangeTab={setActiveTab}>
            {tabFilters.map((f, i) =>
                [f.table,
                    <EntityTable
                        icatClient={icatClient}
                        sessionId={sessionId}
                        filter={f}
                        handleFilterChange={f => handleFilterChange(i, f)}
                        openRelated={(e, id, isOneToMany) =>
                            openRelated(e, f.table, id, isOneToMany)}
                        changeSortField={k => changeSortField(i, k)}
                        isOpen={i === activeTab}
                        key={f.key} />])}
        </TabWindow>
        </>
    );
}

export default EntityViewer;