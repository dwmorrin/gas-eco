# Equipment Check Out
Google Apps Script inventory management program.

## Features
* Works with barcodes to associate items with students.
* Uses Sheets as a database.

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
* gs/Item
* gs/Note
* gs/Student

#### Controllers
* gs/Main: implementation agnostic router of requests, responses
* gs/Sheets: the Sheets implementation specific code
