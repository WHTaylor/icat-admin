import {JSX} from "preact";
import {useState} from "preact/hooks";

import style from './style.module.css';

import {getLastLogin, getServerNames} from '../../connectioncache'
import LoadingIndicator from "../generic/loading-indicator";
import {WithSuffix} from "../generic/with-indicator";

function processServerName(name: string): string {
    if (name.trim().length === 0) return "";
    let processed = name.toLowerCase();
    if (name.split("://").length === 1) {
        processed = "https://" + processed;
    }
    return new URL(processed).origin;
}

type Props = {
    doLogin: (
        server: string,
        plugin: string,
        username: string,
        password: string) => void;
    errMsg: string | null;
    isLoggingIn: boolean;
}
const LoginFormView = ({doLogin, errMsg, isLoggingIn}: Props) => {
    const getInput = (id: string) =>
        document.getElementById(id) as HTMLInputElement;
    const submit = (ev: JSX.TargetedEvent<HTMLFormElement, Event>) => {
        ev.preventDefault();
        doLogin(
            // Server input could be an input or a select, but it always has a value
            processServerName(getInput("serverInput").value),
            getInput("pluginInput").value,
            getInput("usernameInput").value,
            getInput("passwordInput").value);
    };

    return (
        <form
            class="mainContent"
            className={`mainContent ${style.loginForm}`}
            onSubmit={submit}>

            <ServerSelector/>

            <div>
                <label htmlFor="pluginInput">Auth plugin:</label>
                <input type="text" name="plugin" id="pluginInput" defaultValue="anon"/>
            </div>

            <div>
                <label for="usernameInput">Username:</label>
                <input type="text" name="username" id="usernameInput"/>
            </div>

            <div>
                <label htmlFor="passwordInput">Password:</label>
                <input type="password" name="password" id="passwordInput"/>
            </div>

            <button>Login</button>

            {errMsg != null && <p>{errMsg}</p>}
            {isLoggingIn &&
                <WithSuffix suffix={<LoadingIndicator/>}>Logging in...</WithSuffix>}
        </form>);
}

/* Input for the server to connect to.
 *
 * If there are servers stored in localStorage, will be a dropdown list of those
 * servers and a button to allow adding a new server. If there are no stored
 * servers, or the user clicks the button, will be a text input.
 */
const ServerSelector = () => {
    const lastLogin = getLastLogin();
    const server = lastLogin?.server;
    const serverOptions = getServerNames()
        .map(s => s === server
            ? <option key={s} selected>{s}</option>
            : <option key={s}>{s}</option>);
    const [addingServer, setAddingServer] = useState(serverOptions.length === 0);

    const input = addingServer
        ? <input id="serverInput" type="text"/>
        : <select id="serverInput">{serverOptions}</select>;

    const button = <button
        type="button"
        onClick={() => setAddingServer(!addingServer)}>
        {addingServer ? "Cancel" : "Add new server"} </button>;

    return (
        <div>
            <label for="serverInput">ICAT Server:</label>
            <span className={style.serverSelectorInput}>
                {input}
                {serverOptions.length > 0 && button}
            </span>
        </div>
    );
};

export default LoginFormView;
