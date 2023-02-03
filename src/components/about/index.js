import {h} from "preact";

const About = () => (
    <div class="page">
        <h2 class="leftColumn">About ICAT Admin</h2>
        <p class="mainContent">A web app for browsing and editing ICAT data. Designed to be an alternative to <a href="https://github.com/icatproject/manager.icat-manager">ICAT Manager</a>, which is no longer developed, has some bugs, and is built on outdated dependencies.</p>
        <p class="mainContent">The source code for the site is available <a href="https://github.com/wonkyspecs/icat-admin">on github</a>. The site is built with <a href="https://preactjs.com/">Preact</a>, and is currently hosted by <a href="https://www.netlify.com/">Netlify</a>.</p>
        <h3 class="leftColumn">Roadmap</h3>
        <p class="mainContent">To reach feature parity with ICAT manager, the next set of features to add are:</p>
        <ul class="mainContent">
            <li>Validation and autofill during editing</li>
        </ul>
        <p class="mainContent">Additionally, I'm hoping to add:</p>
        <ul class="mainContent">
            <li>Changing column order/visibility</li>
            <li>JPQL worksheets</li>
        </ul>
    </div>);

export default About;
