import {useState} from "preact/hooks";
import {h} from "preact";

import IcatClient from '../../icat.js';
import LoginForm from '../login-form';

/* Handles state for logging in to an ICAT server.
 */
const ServerConnector = ({createConnection: (login: string) => void}) => {
    const [errMsg, setErrMsg] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const doLogin = async (server, plugin, username, password) => {
        if (server.trim().length === 0) {
            setErrMsg("Server must be specified")
            return;
        } else if (plugin.trim().length === 0) {
            setErrMsg("Auth plugin must be specified")
            return;
        }
        const client = new IcatClient(server);
        setIsLoggingIn(true);
        setErrMsg(null);
        await client.login(plugin, username, password)
            .then(s => {
                if (typeof s === "string") {
                    const u = plugin === "anon" ? "anon" : `${plugin}/${username}`;
                    const login = {server, username: u, sessionId: s}
                    createConnection(login);
                } else {
                    return Promise.reject("Failed to connect " + s.toString());
                }
            })
            .catch(err => {
                setErrMsg(err.toString());
                setIsLoggingIn(false)
            });
    };
    return <div class="page">
        <LoginForm errMsg={errMsg} doLogin={doLogin} isLoggingIn={isLoggingIn}/>
    </div>;
}

export default ServerConnector;
