# Equipment Check Out

Google Apps Script (GAS) inventory management program.

## Features

- Uses Sheets as a database to track inventory checked out to users
- Point-of-sale web app UI (barcode-scanning driven)

## Global dependencies

A couple of npm packages are assumed to be globally installed:

- [`clasp`](https://github.com/google/clasp)
- [`rollup`](https://rollupjs.org)

### `.clasp.json`

`clasp` should be configured to use the `build` directory to sync files.
You can manually enter this or use the `--rootDir ./build` option with `clasp`.

```json
{
  "scriptId": "your script ID",
  "rootDir:" "build/"
}
```

## Build

`make` will build the server code from the `gs` directory and the client app
from the `css`, `html`, and `js` directories.

`make push` builds and then runs `clasp push` to sync with script.google.com.

## Code organization

### Server

#### HTTP

GAS requires `doGet()` be the entry point for a web app. When a client sends
a HTTP GET request to the published URL, `doGet()` is invoked, evaluates the
HTML template `index.html` and returns the web page.

All client requests are funnelled through `doGet()` and `doPost()` using
[Flux Standard Action](https://github.com/redux-utilities/flux-standard-action)
syntax for the request body.

### Database: Sheets

The primary motivation of the app: using Sheets as a database.
Equipment is stored in an "inventory" Sheet, people who can check-out equipment
are in a "students" Sheet, and the records of who-checked-out-what is stored in
a "forms" Sheet.

### env.js

Copy `gs/env_sample.js` to `gs/env.js` and enter in the sheet IDs and adjust
sheet names and column numbers as needed. git should ignore the `env.js` file
and `clasp` should ignore the `env_sample.js` file.

### Client

#### HTML

Google Apps Script requires that all the JS and CSS be inlined into HTML files.

The CSS stylesheets are declared individually in `html/index.html`.

The JavaScript uses `rollup` to produce a single `bundle.js` file, so
`index.html` only needs to find that one JS bundle.

In the main entry point, `doGet()`, the GAS built-in `HtmlService`
module concatenates all the CSS and JS files together and sends the resulting
HTML to the client.

Note there is no visible HTML in `index.html`. The body only contains script
tags.

#### JavaScript

The visible document is created via JavaScript.

The `js` directory contains all the client-side Javascript. This gets bundled
by `rollup` and inlined by into `./build/index.html` by `scripts/inline.js`.

At the top level of `js` are various utility modules, the point of entry file
(`index.js`), and a `components` directory.

Files in the `components` directory are analogous to React Function Components:
each function receives properties and returns an `HTMLElement` (the return type
of `document.createElement()`).

The module `HTML` provides `document.createElement()` wrappers to facilitate
declarative style HTML-in-JS programming.

### env.js

Copy `js/env_sample.js` to `js/env.js` and enter in the specifics for your
application. git should ignore the `env.js` file and `clasp` should ignore the
`env_sample.js` file.

#### CSS

There is no bundler for the CSS files. These are just inlined into
`./build/index.html` by `scripts/inline.js`.
