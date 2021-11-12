import { h } from 'preact';
import style from './style.css';
import {useEffect, useState} from "preact/hooks";

import IcatClient from '../../icat.js';
import LoginForm from '../../components/login-form';
import ViewThing from '../../components/view-thing';

const client = new IcatClient("https://icat-dev.isis.stfc.ac.uk");

const Home = () => {
    const [sessionId, setSesssionId] = useState(null);

    const doLogin = async (plugin, username, password) => {
        const s = await client.login(plugin, username, password)
            .catch(err => "oh no" );
        setSesssionId(s);
    };

    const activeComponent = sessionId === null ?
        <LoginForm doLogin={doLogin} /> :
        <ViewThing icatClient={client} sessionId={sessionId} />;


	return (
        <div class={style.home}>
            <h1>Home</h1>
            {activeComponent}
        </div>
    );
}

export default Home;
