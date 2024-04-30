import {JSX} from "preact";
import {useState} from "preact/hooks";

import style from './style.module.css';

import {getLastLogin, getServerNames} from '../../connectioncache'

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
            onSubmit={submit}>

            <ServerSelector/>

            <label for="pluginInput" class={style.block}>Auth plugin:</label>
            <input type="text" name="plugin" id="pluginInput" defaultValue="anon" class={style.block}/>

            <label for="usernameInput" class={style.block}>Username:</label>
            <input type="text" name="username" id="usernameInput" class={style.block}/>

            <label for="passwordInput" class={style.block}>Password:</label>
            <input type="password" name="password" id="passwordInput" class={style.block}/>

            <button class={style.block}>Login</button>

            {errMsg != null && <p>Error logging in: {errMsg}</p>}
            {isLoggingIn && <p>Logging in...</p>}
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
        ? <input id="serverInput" type="text" class={style.inline}/>
        : <select id="serverInput" class={style.inline}>{serverOptions}</select>;

    const button = <button
        type="button"
        onClick={() => setAddingServer(!addingServer)}
        class={style.inline}>
        {addingServer ? "Cancel" : "Add new server"} </button>;

    return (
        <div>
            <label for="serverInput" class={style.block}>ICAT Server:</label>
            {input}
            {serverOptions.length > 0 && button}
        </div>
    );
};

export default LoginFormView;
