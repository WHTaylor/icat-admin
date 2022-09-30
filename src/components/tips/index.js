import SuccessIndicator from '../success-indicator';

const Tips = () => (
    <div class="page">
        <h2>Tips</h2>
        <ul>
            <li>Right click an entry to get links to related entities. Selecting one will open a new entity tab.</li>
            <li>Start typing an entity name and press enter to open a new tab for that entity type. Only works if the main page body has focus, press escape to clear anything that has been typed so far. Autocompletes to the entity name with the longest matching subsequence.</li>
            <li>Middle click an entity tab to close it.</li>
            <li>Drag and drop entity tabs to change their order.</li>
            <li>The most recently opened tab will be restored on next visit, if the session from it is still valid.</li>
            <li>If an update fails, this marker will be displayed: <SuccessIndicator saveState={{failed: true, clear: () => ({}), message: "Error reason will be displayed here"}} />. Hover over it to see the error message.</li>
        </ul>
    </div>);

export default Tips;
