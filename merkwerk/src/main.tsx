import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/games.css';
import './styles/motion.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
