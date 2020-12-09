# Equipment Check Out

Google Apps Script inventory management program.

## Features

- Uses Sheets as a database to track inventory checked out to users
- web app UI set up for use with barcode scanners

## Non-features

- Currently tailored for a specific use case (generalizing is on the todo list)

## Code organization

### Client-side

#### JavaScript

All the visible HTML is created via JavaScript.

- Config is an environment file containing a list of preset locations
  to check equipment out to.
- Item, Inventory, Form, and Stack are classes
- App is the entry file.

(At this point, basically just rewriting this to be a poor imitation of a well-known library)

#### HTML

- html/index: point of entry, just serves as a container for JS and CSS

#### CSS

- css/Style: stylesheet

### Server-side

#### Models

- gs/Form
- gs/Note
- gs/Student

#### Controllers

- gs/Main: implementation agnostic router of requests, responses
- gs/Sheets: the Sheets implementation specific code
