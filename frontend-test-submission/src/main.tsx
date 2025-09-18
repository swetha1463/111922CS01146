import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import logger from '../../logging-middleware/src/logger';

// Initialize logger for the application
logger.logPage('info', 'Application initializing');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);