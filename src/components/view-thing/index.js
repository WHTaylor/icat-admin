import {useEffect, useState} from "preact/hooks";
import style from './style.css';

import {entityNames} from '../../icat.js';
import EntityTable from '../../components/entity-table/container';

const ViewThing = ({icatClient, sessionId}) => {
    const [selectedEntity, setSelectedEntity] = useState(null);
    return (
        <div class={style.viewContainer}>
            <ul>
                {entityNames.map(en =>
                    <li>
                      <button onClick={() => setSelectedEntity(en)}>{en}</button>
                    </li>) }
            </ul>
            { selectedEntity != null &&
                <EntityTable
                    icatClient={icatClient}
                    sessionId={sessionId}
                    table={selectedEntity} /> }
        </div>
    );
}

export default ViewThing;
