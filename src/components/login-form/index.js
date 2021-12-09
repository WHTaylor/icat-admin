function server(isDev) {
    const res = isDev
        ? "https://icat-dev.isis.stfc.ac.uk"
        : "https://icatisis.esc.rl.ac.uk";
    return res;
}

const LoginForm = ({doLogin, errMsg, isLoggingIn}) => {
    const submit = ev => {
        ev.preventDefault();
        doLogin(
            server(document.getElementById("devRadio").checked),
            document.getElementById("pluginInput").value,
            document.getElementById("usernameInput").value,
            document.getElementById("passwordInput").value);
    };

    return (
        <form
            class="mainContent"
            onSubmit={submit}>
            <div>
                <label for="prodRadio">Prod</label>
                <input type="radio" name="server" id="prodRadio" checked />
            </div>
            <div>
                <label for="devRadio">Dev</label>
                <input type="radio" name="server" id="devRadio" />
            </div>
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

export default LoginForm;
