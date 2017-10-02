import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import {createStore} from 'redux'

import '@blueprintjs/core/dist/blueprint.css'
import {FocusStyleManager} from '@blueprintjs/core'

import App from './containers/App'
import reducer from './containers/App/reducer'

import './index.css'
import registerServiceWorker from './registerServiceWorker'

FocusStyleManager.onlyShowFocusOnTabs()

const store = createStore(reducer)

const AppWithState = () => (
  <Provider store={store}>
    <App />
  </Provider>
)

ReactDOM.render(<AppWithState />, document.getElementById('root'));
registerServiceWorker();
