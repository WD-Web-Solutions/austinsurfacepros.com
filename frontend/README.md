# Austinsurfacepros

This project uses Angular 22 and Node.js 24 LTS.

## Prerequisites

From the repository root, run `nvm use` to select the pinned Node.js version.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

Requests under `/api` are proxied to the local FastAPI server at
`http://127.0.0.1:8000`.

## Local blog demo

The development configuration includes a complete browser-local blog demo.
Posts, drafts, hashtags, uploaded images, and cached article embeddings are
stored in IndexedDB. The temporary administrator session uses sessionStorage.
No blog content is sent to the API while the database integration is deferred.

Run the optimized demo configuration with:

```bash
npm run start:demo
```

Open `/login` and select **Use demo admin** to fill the mock credentials. The
button uses these demo-only values:

- Email: `admin@austinsurfacepros.demo`
- Password: `SurfaceProsDemo!`

The production build does not enable the mock account or seed demo posts.

Hybrid blog search combines exact keyword, fuzzy trigram, and semantic ranking.
The Apache-2.0 `Xenova/all-MiniLM-L6-v2` quantized ONNX model is served from
`public/assets/models` and loaded during browser idle time. Remote model loading
is disabled, so article text and search phrases stay on the visitor's device.

To restore the original demo posts, use **Reset demo content** in the content
studio. To remove all local data, clear site data for the development origin in
the browser.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with Vitest, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
