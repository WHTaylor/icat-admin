import {useState} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import {lowercaseFirst, tableFilter} from '../../utils.js';
import EntityTable from '../../components/entity-table/container';
import TabWindow from '../../components/tab-window';

const ViewThing = ({icatClient, sessionId}) => {
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

    const openRelated = (related, origin, originId) =>
        openTab(
            tableFilter(
                related,
                0,
                50,
                `${lowercaseFirst(origin)}.id = ${originId}`));

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

    return (
        <div class={style.viewContainer}>
            <div>
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
                            openRelated={(e, id) => openRelated(e, f.table, id)}
                            isOpen={i === activeTab}
                            key={f.key} />])}
            </TabWindow>
        </div>
    );
}

export default ViewThing;
