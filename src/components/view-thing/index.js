import {useState} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import {lowercaseFirst} from '../../utils.js';
import EntityTable from '../../components/entity-table/container';
import TabWindow from '../../components/tab-window';

const ViewThing = ({icatClient, sessionId}) => {
    const [tabFilters, setTabFilters] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    const changeTabWhere = (i, newWhere) => {
        const newFilter = { ...tabFilters[i], where: newWhere };
        setTabFilters(
            tabFilters.slice(0, i)
                .concat([newFilter])
                .concat(tabFilters.slice(i + 1)));
    };

    const openTab = f => {
        const numTabs = tabFilters.length;
        setTabFilters(tabFilters.concat([f]));
        setActiveTab(numTabs);
    };

    const openRelated = (related, origin, originId) => {
        const filter = {
            table: related,
            where: `${lowercaseFirst(origin)}.id = ${originId}`
        };
        openTab(filter);
    }

    const closeTab = closeIdx => {
        setTabFilters(tabFilters.filter((e, i) => i !== closeIdx));
        if (closeIdx < activeTab) {
            setActiveTab(activeTab - 1);
        } else if (closeIdx === activeTab && closeIdx === 0) {
            setActiveTab(null);
        }
    };

    // TODO: This doesn't really work, because closing any earlier tabs changes idx
    const uniqueKey = (tabName, tabIdx) => {
        return tabName + tabIdx;
    };

    return (
        <div class={style.viewContainer}>
            <ul>
                {entityNames.map(en =>
                    <li>
                      <button
                         onClick={() => openTab({ table: en })}>{en}</button>
                    </li>)}
            </ul>
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
                            handleFilterChange={w => changeTabWhere(i, w)}
                            openRelated={(e, id) => openRelated(e, f.table, id)}
                            key={uniqueKey(f, i)} />])}
            </TabWindow>
        </div>
    );
}

export default ViewThing;
