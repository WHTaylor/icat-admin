import style from './style.module.css'
import EntityBrowser from '../entity-browser';
import {ConnectionState, ConnectionStateAction} from "../../state/connection";
import {Dispatch, useEffect, useMemo} from "preact/hooks";
import ToolsUI from "../tools-ui";
import IcatClient from "../../icat";
import {useConnectionStore} from "../../state/stores";

type Props = {
    connection: ConnectionState
    dispatch: Dispatch<ConnectionStateAction>
}

const ServerConnection = (
    {
        connection,
        dispatch,
    }: Props) => {
    const activeUI = useConnectionStore((state) => state.activeUI);
    const setActiveUI = useConnectionStore((state) => state.setActiveUI);

    useEffect(() => {
        const readKey = (ev: KeyboardEvent) => {
            if (ev.altKey && ev.shiftKey) {
                if (ev.key === "T") {
                    ev.stopPropagation();
                    setActiveUI("Tools");
                } else if (ev.key === "B") {
                    ev.stopPropagation();
                    setActiveUI("Browser");
                }
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [setActiveUI])

    const icatClient = useMemo(() => new IcatClient(
            connection.connectionInfo.server,
            connection.connectionInfo.sessionId),
        [connection.connectionInfo.server, connection.connectionInfo.sessionId]);

    const content = activeUI === "Browser"
        ? <EntityBrowser
            icatClient={icatClient}
            entityTabs={connection.entityTabs}
            dispatch={dispatch}
            key={connection.connectionInfo.sessionId}/>
        : <ToolsUI icatClient={icatClient}/>

    return <div class="page">
        <span class={"leftColumn " + style.uiSwitcher}>
            <button
                title="Switch to browser (Alt-Shift-B)"
                type="button"
                onClick={() => setActiveUI("Browser")}
                class={activeUI === "Browser" ? style.active : ""}
            >
                Browse
            </button>
            <span class={style.spacer}>
                /
            </span>
            <button
                title="Switch to tools (Alt-Shift-T)"
                type="button"
                onClick={() => setActiveUI("Tools")}
                class={activeUI === "Tools" ? style.active : ""}
            >
                Tools
            </button>
        </span>
        {content}
    </div>
}

export default ServerConnection;