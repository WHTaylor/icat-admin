function server(isDev) {
    const res = isDev
        ? "https://icat-dev.isis.stfc.ac.uk"
        : "https://icatisis.esc.rl.ac.uk";
    return res;
}

const Login = ({doLogin, errMsg}) => {
    return (
        <div class="page">
            <div class="mainContent">
                <div>
                    <label for="prodRadio">Prod</label>
                    <input type="radio" name="server" id="prodRadio" checked />
                </div>
                <div>
                    <label for="devRadio">Dev</label>
                    <input type="radio" name="server" id="devRadio" />
                </div>
                <div>
                    <label for="plugin">Auth plugin:</label>
                    <input type="text" name="plugin" id="pluginInput" defaultValue="anon"/>
                </div>
                <div>
                    <label for="username">Username:</label>
                    <input type="text" name="username" id="usernameInput" />
                </div>
                <div>
                    <label for="password">Password:</label>
                    <input type="password" name="password" id="passwordInput" />
                </div>
                <button onClick={() => doLogin(
                    server(document.getElementById("devRadio").checked),
                    document.getElementById("pluginInput").value,
                    document.getElementById("usernameInput").value,
                    document.getElementById("passwordInput").value)}>
                    Login
                </button>
                {errMsg !== null &&
                    <p>Error logging in: {errMsg}</p>}
            </div>
        </div>
    );
}

export default Login;
