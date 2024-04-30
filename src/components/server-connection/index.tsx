import EntityBrowser from '../entity-browser';
import {ConnectionState, ConnectionStateAction} from "../../state/connection";
import {Dispatch} from "preact/hooks";

type Props = {
    connection: ConnectionState
    dispatch: Dispatch<ConnectionStateAction>
}

const ServerConnection = (
    {
        connection,
        dispatch
    }: Props) => {
    return <div class="page">
        <EntityBrowser
            server={connection.connectionInfo.server}
            sessionId={connection.connectionInfo.sessionId}
            entityTabs={connection.entityTabs}
            activeTabIdx={connection.activeTab}
            dispatch={dispatch}
            key={connection.connectionInfo.sessionId}/>
    </div>
}

export default ServerConnection;