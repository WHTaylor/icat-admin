import {useState} from "preact/hooks";
import {getLastLogin, serverNames} from '../../servercache.js'

function processServerName(name) {
    if (name.trim().length === 0) return "";
    let processed = name.toLowerCase();
    if (name.split("://").length === 1) {
        processed = "https://" + processed;
    }
    return new URL(processed).origin
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
            <div>
                <label for="pluginInput">Auth plugin:</label>
                <input type="text" name="plugin" id="pluginInput" defaultValue="anon"/>
            </div>
            <div>
                <label for="usernameInput">Username:</label>
                <input type="text" name="username" id="usernameInput" />
            </div>
            <div>
                <label for="passwordInput">Password:</label>
                <input type="password" name="password" id="passwordInput" />
            </div>
            <input type="submit" value="Login" />
            {errMsg !== null &&
                <p>Error logging in: {errMsg}</p>}
            {isLoggingIn && <p>Logging in...</p>}
        </form>);
}

const ServerSelector = () => {
    const [addingServer, setAddingServer] = useState(false);
    const lastServer = getLastLogin()[0];
    const serverOptions = serverNames()
        .map(s => s === lastServer
            ? <option selected>{s}</option>
            : <option>{s}</option>);

    let input;
    if (serverOptions.length === 0) {
        input = <input id="serverInput" type="text" />;
    } else {
        input =
            <>
                {addingServer
                    ? <input type="text" name="server" id="serverInput"/>
                    : <select id="serverInput">{serverOptions}</select>}
                <button
                    type="button"
                    onClick={() => setAddingServer(!addingServer)}>
                        {addingServer ? "Cancel" : "Add new server"}
                </button>
            </>
    }

    return (
        <>
            <div>
                <label for="serverInput">ICAT Server:</label>
                {input}
            </div>
        </>
    );
}

export default LoginForm;
