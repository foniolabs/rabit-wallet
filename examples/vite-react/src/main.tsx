// MUST be the first import — sets up Buffer/process globals before any
// transitive import (notably @solana/spl-token) tries to read them.
import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
