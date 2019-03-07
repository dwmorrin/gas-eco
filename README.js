/**
 * EQUIPMENT CHECK OUT
 * @author David Morrin <dm187@nyu.edu>
 *
 * This is an inventory management program.
 * Item barcodes and IDs are scanned to associate items with students.
 *
 * Code organization:
 *   CLIENT SIDE JAVASCRIPT:
 *     js/app: Main app object.
 *       js/app/<object>: some object inside of the main app object
 *     
 *     js/Display: presentation routines (views)
 *     js/Init: Init routine
 *     js/Logic: client side controller logic
 *     js/Utility: DOM, date, and form helper functions
 *     
 *  HTML:
 *     html/index: main HTML template
 *     html/<PageName>: straight HTML files for templating
 *     css/Style: the stylesheet
 *
 *  SERVER SIDE JAVASCRIPT:
 *     MODELS:
 *       gs/Booking
 *       gs/Form
 *       gs/Item
 *       gs/Note
 *       gs/Student
 *
 *     CONTROLLERS:
 *       Main: implementation agnostic router of requests, responses
 *       Sheets: the Sheets implementation specific code
 *       Demo: the demo implementation specific code
 */
