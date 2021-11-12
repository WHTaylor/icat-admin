import { h } from 'preact';
import style from './style.css';
import {useEffect, useState} from "preact/hooks";

import IcatClient from '../../icat.js';
import LoginForm from '../../components/login-form';
import ViewThing from '../../components/view-thing';

const client = new IcatClient("https://icat-dev.isis.stfc.ac.uk");

const setCachedSessionId = s => localStorage.setItem("sessionId", s);
const getCachedSessionId = () => localStorage.getItem("sessionId");
const clearCachedSessionId = () => localStorage.removeItem("sessionId");
async function hasValidCachedSession() {
    var stored = getCachedSessionId();
    if (stored === null) return false;
    return client.isValidSession(stored);
}

const Home = () => {
    const [sessionId, setSessionId] = useState(null);
    hasValidCachedSession()
        .then(setSessionId(getCachedSessionId()));

    const doLogin = async (plugin, username, password) => {
        const s = await client.login(plugin, username, password)
            .catch(err => "oh no" );
        setSessionId(s);
        setCachedSessionId(s);
    };

    const logout = sessionId => {
        client.logout(sessionId);
        clearCachedSessionId()
        setSessionId(null);
    }

    const activeComponent = sessionId === null
        ? <LoginForm doLogin={doLogin} />
        : <ViewThing icatClient={client} sessionId={sessionId} />;

	return (
        <div class={style.home}>
            {sessionId !== null && <button onClick={() => logout(sessionId)}>Logout</button> }
            <h1>Home</h1>
            {activeComponent}
        </div>
    );
};

export default Home;
