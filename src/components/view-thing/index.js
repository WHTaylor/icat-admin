import {useState} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import {lowercaseFirst} from '../../utils.js';
import EntityTable from '../../components/entity-table/container';
import TabWindow from '../../components/tab-window';

const ViewThing = ({icatClient, sessionId}) => {
    const [tabFilters, setTabFilters] = useState([]);

    const changeTabWhere = (i, newWhere) => {
        const newFilter = { ...tabFilters[i], where: newWhere };
        setTabFilters(
            tabFilters.slice(0, i)
                .concat([newFilter])
                .concat(tabFilters.slice(i + 1)));
    };

    const openTab = f => {
        setTabFilters(tabFilters.concat([f]));
    };

    const openRelated = (related, origin, originId) => {
        const filter = {
            table: related,
            where: `${lowercaseFirst(origin)}.id = ${originId}`
        };
        openTab(filter);
    }

    const closeTab = n => {
        setTabFilters(tabFilters.filter((e, i) => i !== n));
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
            <TabWindow closeTab={closeTab}>
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
