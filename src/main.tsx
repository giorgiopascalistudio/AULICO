import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MobileHomeHint } from './components/MobileHomeHint';
import './index.css';

// ---- Zoom disabilitato anche su desktop/Safari (il viewport meta copre il mobile) ----
// ctrl/cmd + rotella (pinch su trackpad arriva come wheel+ctrlKey)
window.addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
// ctrl/cmd + '+' / '-' / '0'
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
});
// pinch su Safari (eventi proprietari gesture*)
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault())
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <MobileHomeHint />
  </StrictMode>,
);
