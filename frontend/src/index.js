import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import { loadTranslations } from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Load DB translations then render
loadTranslations().finally(() => {
  root.render(<React.StrictMode><App /></React.StrictMode>);
});
