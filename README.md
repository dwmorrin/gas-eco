# Equipment Check Out

Google Apps Script (GAS) inventory management program.

## Features

- Uses Sheets as a database to track inventory checked out to users
- Point-of-sale web app UI (barcode-scanning driven)

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

The CSS and JS files are declared in `index.html`.
In the main entry point, `doGet()`, the GAS built-in `HtmlService`
module concatenates all the CSS and JS files together and sends the resulting
HTML to the client.

Note there is no visible HTML in `index.html`. The body only contains script
tags.

#### JavaScript

The visible document is created via JavaScript.

The `js` directory contains HTML files because this is what GAS demands, however
they contain no HTML, just inline JavaScript.

At the top level of `js` are various utility modules, the point of entry file
(`App.html`), and a `components` directory.

Files in the `components` directory are analogous to React Function Components:
each function receives properties and returns an `HTMLElement` (the return type
of `document.createElement()`).

The module `HTML` provides `document.createElement()` wrappers to facilitate
declarative style HTML-in-JS programming.

### env.html

Copy `js/env_sample.html` to `js/env.html` and enter in the specifics for your
application. git should ignore the `env.js` file and `clasp` should ignore the
`env_sample.js` file.

#### CSS

Like the `js` directory, the `css` directory contains HTML files to satisfy GAS.
The files only contain inline stylesheets.
