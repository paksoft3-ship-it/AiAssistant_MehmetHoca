import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {runLegacyMigration} from './db/migrations';

// One-time, non-destructive migration of prototype localStorage data into
// IndexedDB. Runs in the background; legacy keys are preserved either way, so
// the (still localStorage-based) App keeps working while the new persistence
// layer is populated for upcoming phases. Failures are logged, never fatal.
void runLegacyMigration()
  .then((outcome) => {
    if (outcome.ran) {
      console.info(
        `[EidosUs] Migrated ${outcome.migratedDocuments} document(s) and ${outcome.migratedNotes} note(s) to IndexedDB.`,
      );
    }
  })
  .catch((err) => {
    console.warn('[EidosUs] Legacy migration skipped due to an error:', err);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
