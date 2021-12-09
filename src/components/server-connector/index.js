import { useState } from "preact/hooks";

import IcatClient from '../../icat.js';
import LoginForm from '../login-form';

const ServerConnector = ({createConnection}) => {
    const [errMsg, setErrMsg] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const doLogin = async (server, plugin, username, password) => {
        const client = new IcatClient(server);
        setIsLoggingIn(true);
        setErrMsg(null);
        await client.login(plugin, username, password)
            .then(s => {
                if (typeof s === "string") {
                    createConnection(server, s);
                } else {
                    return Promise.reject("Failed to connect " + s.toString());
                }
            })
            .catch(err => setErrMsg(err.toString()))
            .finally(() => setIsLoggingIn(false));
    };
    return <div class="page">
        <LoginForm errMsg={errMsg} doLogin={doLogin} isLoggingIn={isLoggingIn} />
    </div>;
}

export default ServerConnector;
