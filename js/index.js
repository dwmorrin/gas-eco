/* global google */

/**
 * @typedef {Object} Action
 * @property {string} type identifies the action
 * @property {*=} payload data the receiver consumes to complete the action
 * @property {*=} meta additional info that is neither type nor payload
 * @property {boolean=} error if and only if true, there is an error
 */

import {
  button,
  createElement,
  heading1,
  modal,
  page,
  paragraph,
  toast,
  update,
} from "./HTML";
import {
  compareDateStrings,
  compareKey,
  getSequentialNumber,
  replace,
  sort,
  tryJsonParse,
} from "./Utility";
import { getByBarcode } from "./Inventory";
import { addOneHour, getFormattedDateTime, minutes } from "./DateUtils";
import Form from "./Form";
import Item from "./Item";
import env from "./env";
import ClosedFormsPage from "./components/ClosedFormsPage";
import FormPage from "./components/FormPage";
import LoadingPage from "./components/LoadingPage";
import OpenFormsPage from "./components/OpenFormsPage";
import Page from "./Page";

// need reference so we can update this to change views
const pageContainer = createElement("div");

const pages = {
  loading: new Page({
    usesHistory: false,
    name: "loading",
    component: LoadingPage,
    parent: pageContainer,
    onShow(state) {
      disableButtons();
      if (!state.notLoading) setNotLoadingTimeout();
      return {
        rosterStatus: state.roster
          ? `${state.roster.length} people downloaded`
          : "Loading students...",
        inventoryStatus: state.inventory
          ? `${state.inventory.length} items downloaded`
          : "Loading inventory...",
        openFormsStatus: state.openForms
          ? `${state.openForms.length} open forms downloaded`
          : "Loading open forms...",
        timedOut: state.notLoading,
      };
    },
  }),
  open: new Page({
    name: "open",
    component: OpenFormsPage,
    parent: pageContainer,
    onShow(state) {
      setOpenFormsTimeout();
      return {
        ascending: state.openFormSortAscending,
        itemsOutSort: state.itemsOutSort,
        itemsOutSortAscending: state.itemsOutSortAscending,
        onSortForms,
        onSortItemsOut,
        openForms: state.openForms,
        showFormPage: (props) => showPage(pages.form, props),
        sortedBy: state.openFormSort,
        refreshing: state.refreshing,
        refreshOpenForms,
      };
    },
    onHide() {
      clearOpenFormsTimeout();
    },
  }),
  closed: new Page({
    name: "closed",
    component: ClosedFormsPage,
    parent: pageContainer,
    onShow(state) {
      return {
        closedForms: state.closedForms,
        closedFormsQuery: state.closedFormsQuery,
        closedFormsSort: state.closedFormsSort,
        closedFormsSortAscending: state.closedFormsSortAscending,
        setClosedFormsQuery: (query) => (state.closedFormsQuery = query),
        setClosedFormsSort: (sort, ascending) => {
          state.closedFormsSort = sort;
          state.closedFormsSortAscending = ascending;
        },
        showFormPage: (props) => showPage(pages.form, props),
        status: ClosedFormsStatus(),
      };
    },
  }),
  form: new Page({
    name: "form",
    component: FormPage,
    parent: pageContainer,
    postShow() {
      onAutoFocus();
    },
    onShow(
      state,
      { filteredForms, type = "open", disabled = false, form, waiting = false }
    ) {
      if (filteredForms) state.closedFormsFiltered = filteredForms;
      if (type === "closed") disabled = true;
      const forms =
        type === "open" ? state.openForms : state.closedFormsFiltered;
      const savable =
        state.undoStack.length &&
        !state.saved &&
        !!form.location &&
        form.validTime &&
        form.students.some(({ timeSignedInByClient }) => timeSignedInByClient);

      if (savable) setAutosave(form);
      else clearAutosave();
      return {
        disabled,
        form,
        formIndexDisplay: `${forms.findIndex(({ id }) => id === form.id) + 1}/${
          forms.length
        }`,
        formInputsTouched: state.formInputsTouched,
        inventory: state.inventory,
        itemSort: state.itemSort,
        itemSortAscending: state.itemSortAscending,
        onChange: makeOnChange(form),
        onDelete,
        onNeedsSignature,
        onNewCodabar,
        onNewForm,
        onFormNavigation: makeFormNavigation(forms, type),
        onRedo,
        onSortItems: makeOnSortItems(disabled),
        onSubmit,
        onUndo,
        roster: state.roster,
        savable,
        saved: state.saved,
        userName: getUsername(),
        waiting,
      };
    },
  }),
};

// seal forces all properties to be declared here
const state = Object.seal({
  autosaveTimeoutId: 0,
  /** @type {(Form[] | null)} */ closedForms: null,
  /** @type {(Form[] | null)} */ closedFormsFiltered: null,
  closedFormsDownloading: true,
  closedFormsQuery: {},
  closedFormsSort: "startTime",
  closedFormsSortAscending: true,
  currentPage: pages.loading,
  formInputsTouched: new Set(),
  inventory: /* Item[] | null */ null,
  itemSort: "timeCheckedOutByClient",
  itemSortAscending: true,
  itemsOutSort: "description",
  itemsOutSortAscending: true,
  lastClosedFormRow: 0,
  notLoading: false,
  notLoadingTimeoutId: 0,
  openFormSort: "startTime",
  openFormSortAscending: true,
  /** @type {(Form[] | null)} */ openForms: null,
  openFormsModifiedTime: 0,
  openFormsTimeoutContext: 0,
  openFormsTimeoutId: 0,
  overlapWarningGiven: false,
  /** @type {Form[]} */ redoStack: [], // each undo is pushed into here
  refreshing: false,
  roster: null,
  saved: true,
  /** @type {Form[]} */ undoStack: [], // each change pushes the old Form here
});

const newFormButton = button("New Form", {
  class: "share",
  disabled: true,
  onClick: () => onNewForm(),
});

const openFormsButton = button("View Open Forms", {
  disabled: true,
  onClick: () => {
    loseDataWarning(() => {
      // prevent unnecessary server call if quickly switching pages
      if (Date.now() - state.openFormsModifiedTime > minutes(2)) {
        state.openForms = null;
        fetch({
          type: "openForms",
          onSuccess: checkForError(onOpenForms),
          unlock: true,
        });
        showPage(pages.loading);
      } else showPage(pages.open);
    });
  },
});

const closedFormsButton = button("View Closed Forms", {
  disabled: true,
  onClick: () => loseDataWarning(() => showPage(pages.closed)),
});

const navigationButtons = [newFormButton, openFormsButton, closedFormsButton];

const userNameDisplay = createElement("span", { class: "userNameDisplay" });

// Render static elements
document.body.appendChild(
  page({
    name: "app",
    children: [
      createElement("header", {
        children: [
          heading1("Equipment Check Out"),
          createElement("span", {
            class: "userNameContainer",
            textContent: "signed in as ",
            child: userNameDisplay,
          }),
        ],
      }),
      createElement("nav", {
        children: navigationButtons,
      }),
      pageContainer,
    ],
  })
);

// Render initial view: loading page
showPage(pages.loading);

// initial server calls
fetch({
  type: "openForms",
  onSuccess: checkForError(onOpenForms),
  unlock: true,
});
fetch({
  type: "userName",
  onSuccess: checkForError(
    ({ payload: { userName } }) => (userNameDisplay.textContent = userName)
  ),
  unlock: true,
});
fetch({
  type: "students",
  onSuccess: checkForError(onStudents),
  unlock: true,
});
fetch({ type: "items", onSuccess: checkForError(onItems), unlock: true });
fetch({
  type: "closedForms",
  payload: { lastClosedFormRow: state.lastClosedFormRow },
  onSuccess: checkForError(onClosedForms),
  unlock: true,
});

/**
 * Warns user when trying to close tab and changes are not saved.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload}
 */
window.addEventListener("beforeunload", function (event) {
  if (!state.saved) {
    event.preventDefault(); // Firefox, Safari
    event.returnValue = ""; // Chrome, Edge, Firefox
  }
});

// have to attach to window to catch this regardless of focus
// should probably check context, because this is currently a FormPage
// context, but could not figure out how to declare inside FormPage
window.addEventListener("keydown", (event) => {
  if (event.target.tagName && event.target.tagName.toLowerCase() === "input")
    return;
  if ((event.metaKey || event.ctrlKey) && event.key === "z") {
    event.preventDefault();
    if (event.shiftKey) return onRedo();
    return onUndo();
  }
});

//---- function definitions

function ClosedFormsStatus() {
  return paragraph(
    `Oldest form: ${state.closedForms[0].startTime}${
      state.closedFormsDownloading ? ". Still downloading..." : ""
    }`
  );
}

function checkForError(onSuccess, onFailure = () => undefined) {
  return (...args) => {
    if (args[0].error) {
      if (args[0].payload && args[0].payload.message)
        displayErrorMessage(args[0].payload.message);
      else displayErrorMessage("Uh-oh, we have an error.");
      console.error(...args);
      return onFailure(...args);
    }
    return onSuccess(...args);
  };
}

function clearAutosave() {
  if (state.autosaveTimeoutId) {
    window.clearTimeout(state.autosaveTimeoutId);
    state.autosaveTimeoutId = 0;
  }
}

function clearOpenFormsTimeout() {
  state.openFormsTimeoutContext = 0;
  if (state.openFormsTimeoutId) {
    window.clearTimeout(state.openFormsTimeoutId);
    state.openFormsTimeoutId = 0;
  }
}

function clearNotLoading() {
  if (state.notLoadingTimeoutId) {
    window.clearTimeout(state.notLoadingTimeoutId);
    state.notLoadingTimeoutId = 0;
  }
  state.notLoading = false;
}

function disableButtons() {
  navigationButtons.forEach((button) => button.setAttribute("disabled", true));
}

function displayErrorMessage(message) {
  modal({
    children: [heading1("Error"), paragraph(message)],
  });
}

function fetch({
  context,
  method = "get",
  onFailure = onError,
  onSuccess = () => undefined,
  payload = {},
  type = "",
  unlock = false,
}) {
  const runner = google.script.run
    .withFailureHandler(onFailure)
    .withSuccessHandler(onSuccess)
    .withUserObject({ context, unlock });
  if (method === "get") return runner.doGet({ type, payload });
  if (method === "post") return runner.doPost({ type, payload });
  console.error(`unknown method: ${method}`);
}

function getOverlappingForms(form) {
  return state.openForms === null
    ? []
    : state.openForms.filter((f) => Form.overlap(form, f));
}

function getUsername() {
  const el = document.querySelector("span.userNameDisplay");
  return el && el.textContent ? el.textContent : "anonymous";
}

/**
 * Runs when user has unsaved work.
 * Must include a callback function to run when user chooses OK.
 * Optionally include a callback when user just closes the modal.
 * @param {() => unknown} onOk
 * @param {() => unknown} onClose
 */
function loseDataWarning(onOk, onClose = () => undefined) {
  if (state.saved || !state.undoStack.length) reset(onOk);
  else
    modal({
      children: [
        heading1("Warning, your changes are not saved"),
        paragraph("Are you sure?"),
      ],
      closeText: "Cancel",
      okText: "Lose changes",
      onOk: () => reset(onOk),
      onClose,
    });
}

function isLoaded() {
  return [state.inventory, state.roster, state.openForms].every(Boolean);
}

function makeFormNavigation(forms, type) {
  return ({ form, previous = false }) => {
    const index =
      forms.findIndex(({ id }) => id === form.id) + (previous ? -1 : 1);
    if (index < 0 || !forms[index])
      return modal({
        child: paragraph(`This is the ${previous ? "first" : "last"} form.`),
      });
    loseDataWarning(() => showPage(pages.form, { form: forms[index], type }));
  };
}

function makeOnChange(currentForm) {
  return ({
    form,
    change: {
      target: { name, value },
    },
    manualWarning = false,
  }) => {
    if (!state.overlapWarningGiven && getOverlappingForms(form).length) {
      state.overlapWarningGiven = true;
      modal({
        children: [
          heading1("Overlapping form found"),
          paragraph(
            "Warning: there is already a form in this location during the same time period."
          ),
        ],
      });
    }

    if (env.rules && env.rules.equipmentAllowedByLocation) {
      if (
        name === "items" &&
        form.location in env.rules.equipmentAllowedByLocation
      ) {
        if (
          !form.items.every(({ barcode }) =>
            env.rules.equipmentAllowedByLocation[form.location].includes(
              barcode
            )
          )
        )
          modal({
            children: [
              heading1(`${form.location} is restricted`),
              paragraph(
                "Warning: this room is only allowed the following items: " +
                  env.rules.equipmentAllowedByLocation[form.location]
                    .map((barcode) => {
                      const item = getByBarcode(state.inventory, barcode);
                      return item ? item.description : "";
                    })
                    .filter(String)
                    .join(", ")
              ),
            ],
          });
      }
    }

    const newNotes = [
      {
        timestamp: Date.now(),
        author: getUsername(),
        // body is JSON to be compatible with legacy forms
        // if diff'ing notes vs changes can be updated, stop stringifying here
        body: JSON.stringify([{ name, value }]),
      },
    ];

    if (manualWarning)
      newNotes.push({
        timestamp: Date.now(),
        author: getUsername(),
        body: JSON.stringify([{ name: "manual", value: "warned" }]),
      });

    const newForm = new Form({
      ...form,
      notes: [...form.notes, ...newNotes],
    });
    state.formInputsTouched.add(name);
    state.undoStack.push(currentForm);
    state.redoStack = [];
    state.saved = false;
    showPage(pages.form, { form: newForm });
    if (["items", "students"].includes(name)) toast(value);
  };
}

function makeOnSortItems(disabled) {
  return (name, form) => {
    if (state.itemSort !== name) state.itemSort = name;
    else state.itemSortAscending = !state.itemSortAscending;
    showPage(pages.form, { form, type: disabled ? "closed" : "open" });
  };
}

function onAutoFocus() {
  pageContainer.querySelector(".omnibox").focus();
}

/** * @param {Action} response */
function onClosedForms(
  { payload: { done, firstRow, formList } },
  { unlock } = {}
) {
  const closedForms = tryJsonParse(formList);
  if (!closedForms)
    return displayErrorMessage(
      "Server was unable to retrieve the closed forms."
    );
  const currentForms = state.closedForms || [];
  state.closedForms = sort(
    [...currentForms, ...closedForms.map((form) => new Form(form))],
    compareKey("startTime", compareDateStrings)
  );
  state.lastClosedFormRow = firstRow;

  if (!done)
    fetch({
      type: "closedForms",
      onSuccess: checkForError(onClosedForms),
      payload: { lastClosedFormRow: state.lastClosedFormRow },
    });
  else state.closedFormsDownloading = false;

  if (unlock && isLoaded()) closedFormsButton.removeAttribute("disabled");
  else if (state.currentPage === pages.closed) updateClosedFormsPage();
}

function onCollision() {
  modal({
    children: [
      heading1("Uh-oh, your form conflicts with another form"),
      paragraph(
        [
          "A newer version of the form has been found on the server.",
          "In a future update you can save your work,",
          "but currently we have no way to combine your local work",
          "with what is on the server. Your local work will be lost.",
        ].join(" ")
      ),
    ],
    onClose: () => {
      fetch({
        type: "openForms",
        onSuccess: checkForError(onOpenForms),
        unlock: true,
      });
      reset(() => showPage(pages.loading));
    },
  });
}

function onDelete(form) {
  const onOk = () => {
    fetch({
      method: "post",
      type: "deleteForm",
      payload: JSON.stringify(form),
      onSuccess: checkForError(({ type, payload }) => {
        if (type === "openForms") {
          return reset(() => onOpenForms({ payload }));
        }
        if (type === "collision") return onCollision({ payload });
      }),
    });
    showPage(pages.form, { form, disabled: true, waiting: true });
  };

  modal({
    children: [
      heading1("Are you sure?"),
      paragraph("This will delete the form. You cannot undo this action."),
    ],
    onOk,
    okText: "Delete this form",
  });
}

function onError(error) {
  console.error(error);
  displayErrorMessage(error.message);
}

/** * @param {Action} response */
function onItems({ payload: { items } }, { unlock } = {}) {
  const inventory = tryJsonParse(items);
  if (!inventory)
    return displayErrorMessage("Error getting inventory from server");
  if (!inventory.length) {
    return displayErrorMessage("Error: Server found no items!");
  }
  state.inventory = inventory.map((item) => new Item(item));
  if (unlock) tryUnlock();
}

/**
 * For preventing a user who has not agreed to the terms of service from
 * using the system.
 * Assumes the means of signing the terms of service is external to the app.
 */
function onNeedsSignature({ form, handleStudent, netId }) {
  modal({
    children: [
      heading1("Add signature"),
      paragraph(env.needsSignatureMessage || "Signature not found."),
    ],
    okText: "Refresh student info",
    onOk: () => {
      showPage(pages.form, { form, waiting: true });
      fetch({
        type: "students",
        onSuccess: checkForError((response) => {
          onStudents(response);
          showPage(pages.form, { form, waiting: false });
          // automatically try to update the form
          handleStudent(state.roster.find((s) => s.netId === netId));
        }),
      });
    },
  });
}

function onNewCodabar({ netId, codabar, handleStudent }) {
  const { remove } = modal({
    noClose: true,
    children: [heading1("Updating student info")],
  });
  fetch({
    method: "post",
    type: "codabar",
    payload: { netId, codabar },
    onSuccess: checkForError((response) => {
      const students = tryJsonParse(response.students);
      if (!students)
        return displayErrorMessage("Error retrieving student list from server");
      state.roster = students.map(Object.freeze);
      const student = state.roster.find(({ id }) => id === codabar);
      if (!student)
        return displayErrorMessage(
          "Error updating student info: student not found after update."
        );
      handleStudent(student);
      remove();
    }),
  });
}

function onNewForm(form) {
  loseDataWarning(() => {
    if (!form)
      form = new Form({
        startTime: getFormattedDateTime(new Date(), true),
        endTime: getFormattedDateTime(addOneHour(new Date()), true),
      });
    state.openForms = [...state.openForms, form];
    state.saved = false;
    showPage(pages.form, { form });
  });
}

/** * @param {Action} response */
function onOpenForms({ payload: { formList } }, { unlock } = {}) {
  const openForms = tryJsonParse(formList);
  if (!openForms)
    return displayErrorMessage("Error: server failed to get the open forms.");
  state.openForms = openForms.map((form) => new Form(form));
  state.openFormsModifiedTime = Date.now();
  if (unlock) tryUnlock();
  else showPage(pages.open);
}

function onRedo(currentForm) {
  if (!state.redoStack.length)
    return modal({ child: paragraph("Nothing to redo.") });
  state.undoStack.push(currentForm);
  showPage(pages.form, { form: state.redoStack.pop() });
}

function onSortForms(name) {
  if (state.openFormSort !== name) state.openFormSort = name;
  else state.openFormSortAscending = !state.openFormSortAscending;
  showPage(pages.open);
}

function onSortItemsOut(name) {
  if (state.itemsOutSort !== name) state.itemsOutSort = name;
  else state.itemsOutSortAscending = !state.itemsOutSortAscending;
  showPage(pages.open);
}

/** * @param {Action} response */
function onStudents({ payload: { students } }, { unlock } = {}) {
  const roster = tryJsonParse(students);
  if (!roster) return displayErrorMessage("Error getting roster from server.");
  if (roster.length < 1) {
    return displayErrorMessage("No students found");
  }
  state.roster = roster.map(Object.freeze);
  if (unlock) tryUnlock();
}

function onSubmit(form) {
  fetch({
    method: "post",
    type: "updateForm",
    payload: JSON.stringify(form),
    onSuccess: checkForError(({ type, payload }) => {
      if (type === "updateForm") {
        const updatedForm = new Form(JSON.parse(payload));
        state.openForms = replace(
          state.openForms,
          (form) => form.isBlank || form.id === updatedForm.id,
          updatedForm
        );
        return reset(() => showPage(pages.form, { form: updatedForm }));
      }
      if (type === "openForms") {
        return reset(() => onOpenForms({ payload }));
      }
      if (type === "collision") {
        return onCollision({ payload });
      }
      if (type === "invalid") {
        return displayErrorMessage("Form is invalid");
      }
    }),
  });
  showPage(pages.form, { form, disabled: true, waiting: true });
}

function onUndo(currentForm) {
  if (!state.undoStack.length)
    return modal({
      child: paragraph("Nothing to undo."),
    });
  state.redoStack.push(currentForm);
  showPage(pages.form, { form: state.undoStack.pop() });
}

function refreshOpenForms() {
  state.refreshing = true;
  clearOpenFormsTimeout();
  fetch({
    type: "openForms",
    onSuccess: checkForError((response) => {
      // if these are not equal, then the user has switched context
      state.openFormsTimeoutContext = 0;
      state.refreshing = false;
      onOpenForms(response);
    }),
  });
  showPage(pages.open);
}

function reset(onSuccess) {
  clearAutosave();
  state.saved = true;
  state.openForms = state.openForms.filter((form) => !form.isBlank);
  state.undoStack = [];
  state.redoStack = [];
  state.formInputsTouched.clear();
  state.overlapWarningGiven = false;
  onSuccess();
}

function setAutosave(form) {
  clearAutosave();
  state.autosaveTimeoutId = window.setTimeout(() => {
    state.autosaveTimeoutId = 0;
    onSubmit(form);
  }, minutes(1));
}

function setOpenFormsTimeout() {
  clearOpenFormsTimeout();
  const n = getSequentialNumber();
  state.openFormsTimeoutContext = n;
  state.openFormsTimeoutId = window.setTimeout(
    () =>
      fetch({
        type: "openForms",
        onSuccess: checkForError((response, { context }) => {
          // if these are not equal, then the user has switched context
          if (context !== state.openFormsTimeoutContext) return;
          state.openFormsTimeoutId = 0;
          state.openFormsTimeoutContext = 0;
          onOpenForms(response);
        }),
        context: n,
      }),
    minutes(2)
  );
}

function setNotLoadingTimeout() {
  clearNotLoading();
  state.notLoadingTimeoutId = window.setTimeout(() => {
    state.notLoadingTimeoutId = 0;
    state.notLoading = true;
    showPage(pages.loading);
  }, minutes(0.75));
}

/**
 * @param {Page} page
 * @param {{}} componentProps
 */
function showPage(page, componentProps) {
  state.currentPage.hide(state);
  page.show(state, componentProps);
  state.currentPage = page;
}

/**
 * tryUnlock controls when the loading page switches to the open forms page
 */
function tryUnlock() {
  if (!isLoaded()) {
    return showPage(pages.loading);
  }
  clearNotLoading();
  openFormsButton.removeAttribute("disabled");
  newFormButton.removeAttribute("disabled");
  // separating this last one allows closed forms to lag if needed
  if (state.closedForms) closedFormsButton.removeAttribute("disabled");
  showPage(pages.open);
  return true;
}

function updateClosedFormsPage() {
  update(
    pageContainer.querySelector(".closedFormsStatus"),
    ClosedFormsStatus()
  );
}
