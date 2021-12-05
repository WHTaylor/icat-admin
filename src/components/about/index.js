import style from './style.css';

const About = () => (
    <>
        <h2 class="leftColumn">About ICAT Admin</h2>
        <p class="mainContent">A web app for browsing and (hopefully soon) editing ICAT data. Designed to be an alternative to <a href="https://github.com/icatproject/manager.icat-manager">ICAT Manager</a>, which no longer seems to be being developed, has some annoying bugs, and is built on outdated versions of some pretty chunky dependencies.</p>
        <p class="mainContent">The source code for the site is available <a href="https://github.com/wonkyspecs/icat-admin">on github</a>. The site is built with <a href="https://preactjs.com/">Preact</a>, and is currently hosted by <a href="https://www.netlify.com/">Netlify</a>.</p>
        <h3 class="leftColumn">Roadmap</h3>
        <p class="mainContent">To approximately reach feature parity with ICAT manager, the next set of features to add are:</p>
        <ul class="mainContent">
            <li>Validation and autofill during editing</li>
        </ul>
        <p class="mainContent">Additionally, I'm hoping to add:</p>
        <ul class="mainContent">
            <li>Changing column order</li>
            <li>JPQL worksheets</li>
            <li>Helpers for common admin tasks, ie. moving sets of datafiles to a different dataset</li>
        </ul>
    </>);

export default About
