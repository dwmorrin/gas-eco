# Equipment Check Out
Google Apps Script inventory management program.

## Features
* Uses Sheets as a database to track inventory checked out to users
* web app UI set up for use with barcode scanners

## Non-features
* Currently tailored for a specific use case (generalizing is on the todo list)

## Code organization
### Client-side
#### JavaScript
* js/app: Main app object.
* js/app/\<object\>: some object inside of the main app object     
* js/Display: presentation routines (views)
* js/Init: Init routine
* js/Logic: client side controller logic
* js/Utility: DOM, date, and form helper functions

#### HTML
* html/index: main HTML template
* html/\<PageName\>: straight HTML files for templating

#### CSS
* css/Style: stylesheet

### Server-side
#### Models
* gs/Booking
* gs/Form
* gs/Note
* gs/Student

#### Controllers
* gs/Main: implementation agnostic router of requests, responses
* gs/Sheets: the Sheets implementation specific code
