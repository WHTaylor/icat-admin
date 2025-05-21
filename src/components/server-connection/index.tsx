import style from './style.module.css'
import EntityBrowser from '../entity-browser';
import {ConnectionState, ConnectionStateAction} from "../../state/connection";
import {Dispatch, useCallback, useEffect, useMemo} from "preact/hooks";
import ToolsUI from "../tools-ui";
import IcatClient from "../../icat";

type Props = {
    connection: ConnectionState
    dispatch: Dispatch<ConnectionStateAction>
}

const ServerConnection = (
    {
        connection,
        dispatch,
    }: Props) => {
    const openBrowser = useCallback(() =>
            dispatch({type: "switch_ui", ui: "Browser"}),
        [dispatch]);
    const openTools = useCallback(() =>
            dispatch({type: "switch_ui", ui: "Tools"}),
        [dispatch]);

    useEffect(() => {
        const readKey = (ev: KeyboardEvent) => {
            if (ev.altKey && ev.shiftKey) {
                if (ev.key === "T") {
                    ev.stopPropagation();
                    openTools();
                } else if (ev.key === "B") {
                    ev.stopPropagation();
                    openBrowser();
                }
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [connection, openBrowser, openTools])

    const icatClient = useMemo(() => new IcatClient(
            connection.connectionInfo.server,
            connection.connectionInfo.sessionId),
        [connection.connectionInfo.server, connection.connectionInfo.sessionId]);

    const content = connection.activeUI == "Browser"
        ? <EntityBrowser
            icatClient={icatClient}
            entityTabs={connection.entityTabs}
            dispatch={dispatch}
            key={connection.connectionInfo.sessionId}/>
        : <ToolsUI
            dispatch={dispatch}
            state={connection.toolsState}
            icatClient={icatClient}
        />

    return <div class="page">
        <span class={"leftColumn " + style.uiSwitcher}>
            <button
                title="Switch to browser (Alt-Shift-B)"
                type="button"
                onClick={openBrowser}
                class={connection.activeUI === "Browser" ? style.active : ""}
            >
                Browse
            </button>
            <span class={style.spacer}>
                /
            </span>
            <button
                title="Switch to tools (Alt-Shift-T)"
                type="button"
                onClick={openTools}
                class={connection.activeUI === "Tools" ? style.active : ""}
            >
                Tools
            </button>
        </span>
        {content}
    </div>
}

export default ServerConnection;