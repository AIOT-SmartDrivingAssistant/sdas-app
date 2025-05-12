// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App.jsx'
import GlobalStyles from './components/GlobalStyles'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <GlobalStyles>
        <App />
      </GlobalStyles>
    </BrowserRouter>
)

import 'bootstrap/dist/js/bootstrap.bundle.min.js';