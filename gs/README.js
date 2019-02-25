/**
 * EQUIPMENT CHECK-OUT
 *
 * This is an inventory management program.
 * Item barcodes and IDs are scanned to associate items with students.
 *
 * Code organization:
 *   Because the apps script project has no file system, the file name
 *   must reflect the file hierarchy using camelCase.
 *   i.e. read jsAppChanges.html as js/App/Changes.html
 *   
 *   CLIENT SIDE JAVASCRIPT:
 *
 *     jsApp: Main app object.
 *       jsApp<OBJ>: some OBJ inside of the main app object
 *     
 *     jsDisplay: presentation routines (views)
 *     jsInit: Init routine
 *     jsLogic: client side controller logic
 *     jsUtility: DOM, date, and form helper functions
 *     
 *  HTML:
 *     index: main HTML template
 *     cssStyle: the stylesheet
 *     page<PageName>: straight HTML files for templating
 *
 *  SERVER SIDE JAVASCRIPT:
 *     These files start with an uppercase letter so they sort nicely in the GAS
 *     web editor.
 *
 *     MODELS:
 *       Booking
 *       Form
 *       Item
 *       Note
 *       Student
 *
 *     LOGIC:
 *       Main: Just in case we switch to SQL database, this is implementation agnostic
 *       Sheets: the Sheets implementation specific code
 *       Demo: the demo implementation specific code
 */
