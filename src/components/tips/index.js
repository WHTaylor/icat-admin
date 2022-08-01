import style from './style.css';

const Tips = () => (
    <div class="page">
        <h2>Tips</h2>
        <ul class={style.tipsList}>
            <li>Start typing an entity name and press enter to open a new tab for that entity type. Only works if the main page body has focus, press escape to clear anything that has been typed so far. Autocompletes based to the entity name with the longest matching subsequence.</li>
            <li>Middle click an entity tab to close it.</li>
        </ul>
    </div>);

export default Tips;
