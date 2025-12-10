import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Serve static files from the browser build.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Angular SSR handling for all other routes.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if running directly (dev or production).
 * Default SSR port changed to 4300 (custom).
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4300; // ← DEFAULT PORT SET TO 4300

  app.listen(port, (error) => {
    if (error) throw error;

    console.log(`🚀 ResuRadar SSR Server running at: http://localhost:${port}`);
  });
}

/**
 * CLI / Firebase handler
 */
export const reqHandler = createNodeRequestHandler(app);
