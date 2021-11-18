import {useState} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import EntityTable from '../../components/entity-table/container';
import TabWindow from '../../components/tab-window';

const ViewThing = ({icatClient, sessionId}) => {
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [selectedEntities, setSelectedEntities] = useState([]);

    const openTab = e => setSelectedEntities(selectedEntities.concat([e]));
    const closeTab = n => {
        setSelectedEntities(selectedEntities.filter((e, i) => i !== n));
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
                      <button onClick={() => openTab(en)}>{en}</button>
                    </li>) }
            </ul>
            <TabWindow closeTab={closeTab}>
                {selectedEntities.map((e, i) =>
                    [e, <EntityTable
                            icatClient={icatClient}
                            sessionId={sessionId}
                            table={e}
                            key={uniqueKey(e, i)} />])}
            </TabWindow>
        </div>
    );
}

export default ViewThing;
