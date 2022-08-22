import style from './style.css';

const Tips = () => (
    <div class="page">
        <h2>Tips</h2>
        <ul class={style.tipsList}>
            <li>Right click an entry to get links to related entities. Selecting one will open a new entity tab.</li>
            <li>Start typing an entity name and press enter to open a new tab for that entity type. Only works if the main page body has focus, press escape to clear anything that has been typed so far. Autocompletes to the entity name with the longest matching subsequence.</li>
            <li>Middle click an entity tab to close it.</li>
            <li>Drag and drop entity tabs to change their order</li>
            <li>The most recently opened tab will be restored on next visit, if the session from it is still valid</li>
        </ul>
    </div>);

export default Tips;
