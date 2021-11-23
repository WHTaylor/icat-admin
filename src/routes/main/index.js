import { h } from 'preact';
import {useEffect, useState} from "preact/hooks";

import ViewThing from '../../components/view-thing';

const Main = ({icatClient, sessionId}) => {
	return (
        <div class="page">
            <ViewThing icatClient={icatClient} sessionId={sessionId} />
        </div>);
}

export default Main;
