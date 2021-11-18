import {useState} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import EntityTable from '../../components/entity-table/container';
import TabWindow from '../../components/tab-window';

const ViewThing = ({icatClient, sessionId}) => {
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [selectedEntities, setSelectedEntities] = useState([]);

    const openTab = e => setSelectedEntities(selectedEntities.concat([e]));

    return (
        <div class={style.viewContainer}>
            <ul>
                {entityNames.map(en =>
                    <li>
                      <button onClick={() => openTab(en)}>{en}</button>
                    </li>) }
            </ul>
            <TabWindow>
                {selectedEntities.map(e =>
                    [e, <EntityTable
                        icatClient={icatClient}
                        sessionId={sessionId}
                        table={e} />]) }
            </TabWindow>
        </div>
    );
}

export default ViewThing;
