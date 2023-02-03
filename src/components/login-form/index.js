import {h} from "preact";
import {useState} from "preact/hooks";

import style from './style.css';

import {getLastLogin, getServerNames} from '../../connectioncache.js'

function processServerName(name) {
    if (name.trim().length === 0) return "";
    let processed = name.toLowerCase();
    if (name.split("://").length === 1) {
        processed = "https://" + processed;
    }
    return new URL(processed).origin;
}

const LoginForm = ({doLogin, errMsg, isLoggingIn}) => {
    const submit = ev => {
        ev.preventDefault();
        doLogin(
            processServerName(document.getElementById("serverInput").value),
            document.getElementById("pluginInput").value,
            document.getElementById("usernameInput").value,
            document.getElementById("passwordInput").value);
    };

    return (
        <form
            class="mainContent"
            onSubmit={submit}>

            <ServerSelector />

            <label for="pluginInput" class={style.block}>Auth plugin:</label>
            <input type="text" name="plugin" id="pluginInput" defaultValue="anon" class={style.block} />

            <label for="usernameInput" class={style.block}>Username:</label>
            <input type="text" name="username" id="usernameInput" class={style.block} />

            <label for="passwordInput" class={style.block}>Password:</label>
            <input type="password" name="password" id="passwordInput" class={style.block} />

            <button class={style.block}>Login</button>

            {errMsg !== null &&
                <p>Error logging in: {errMsg}</p>}
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
    const [lastServer, ] = getLastLogin();
    const serverOptions = getServerNames()
        .map(s => s === lastServer
            ? <option key={s} selected>{s}</option>
            : <option key={s}>{s}</option>);
    const [addingServer, setAddingServer] = useState(serverOptions.length === 0);

    const input = addingServer
        ? <input id="serverInput" type="text" class={style.inline} />
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

export default LoginForm;
