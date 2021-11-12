const LoginForm = ({doLogin}) => {
    return (
        <div>
            <div>
                <label for="plugin">Auth plugin:</label>
                <input type="text" name="plugin" id="pluginInput" defaultValue="uows"/>
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
                document.getElementById("pluginInput").value,
                document.getElementById("usernameInput").value,
                document.getElementById("passwordInput").value)}>
                Login
            </button>
        </div>
    );
}

export default LoginForm;
