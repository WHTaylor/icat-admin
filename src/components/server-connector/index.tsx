import {useState} from "preact/hooks";

import IcatClient from '../../icat';
import LoginForm from '../login-form';
import {Connection} from "../../connectioncache";

type Props = {
    createConnection: (login: Connection) => void
}

/**
 * Handles state for logging in to an ICAT server entered in a {@link LoginForm}
 */
const ServerConnector = ({createConnection}: Props) => {
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const doLogin = async (
        server: string,
        plugin: string,
        username: string,
        password: string) => {
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
