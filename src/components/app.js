import { h } from 'preact';

import Header from './header';

// Code-splitting is automated for `routes` directory
import Home from './home';

const App = () => (
	<div id="app">
		<Header />
        <Home />
	</div>
)

export default App;
