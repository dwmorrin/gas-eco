import DateTimeInput from "./DateTimeInput";
import Form from "../Form";
import FormItem from "./FormItem";
import FormItemSectionHeader from "./FormItemSectionHeader";
import FormStudent from "./FormStudent";
import Item from "../Item";
import LocationSelect from "./LocationSelect";
import ModalChangeLog from "./ModalChangeLog";
import ModalItemNotes from "./ModalItemNotes";
import ModalManualEntry from "./ModalManualEntry";
import ModalNewCodabar from "./ModalNewCodabar";
import ModalNewLocation from "./ModalNewLocation";
import ModalNotes from "./ModalNotes";
import ModalQuery from "./ModalQuery";
import ModalStudentNotes from "./ModalStudentNotes";
import Omnibox from "./Omnibox";
import {
  br,
  button,
  cell,
  createElement,
  headerCell,
  heading1,
  modal,
  page,
  paragraph,
  row,
  spinner,
  table,
  tableBody,
  tableHead,
  tip,
  toast,
} from "../HTML";
import {
  applyTo,
  compareDateStrings,
  compareKey,
  compareStrings,
  copyToClipboard,
  identity,
  is,
  nullIf,
  pick,
  replace,
  reverse,
  sort,
  tryJsonParse,
} from "../Utility";
import { addOneHour, getFormattedDateTime } from "../DateUtils";

export default function FormPage({
  disabled = false,
  form,
  formIndexDisplay = "",
  formInputsTouched,
  onChange,
  inventory,
  itemSort,
  itemSortAscending,
  onDelete,
  onFormNavigation,
  onNeedsSignature,
  onNewCodabar,
  onNewForm,
  onRedo,
  onSortItems,
  onSubmit,
  onUndo,
  roster,
  savable = false,
  saved,
  userName = "anonymous",
  waiting,
}) {
  const {
    itemsIn,
    itemsOut,
    itemsReserved,
    itemsStagedForIn,
    itemsStagedForOut,
  } = form;

  return page({
    name: "form",
    children: [
      createElement("form", {
        class: "model",
        onSubmit: (e) => e.preventDefault(),
        children: [
          createElement("section", {
            class: "formControls",
            children: [
              Omnibox({
                disabled,
                form,
                inventory,
                onSubmit: onOmniboxSubmit,
                roster,
                waiting,
              }),
              button("Add item without barcode or ID", {
                class: "action",
                disabled,
                onClick: () => ModalManualEntry({ onSubmit: onManualEntry }),
              }),
              button("New note", {
                class: "action",
                disabled,
                onClick: () => ModalNotes({ form, onChange, userName }),
              }),
              button("Change log", {
                onClick: () => ModalChangeLog({ form }),
                disabled: waiting,
              }),
              nullIf(
                !disabled || waiting,
                button("Copy items to clipboard", {
                  onClick: () => {
                    copyToClipboard(
                      JSON.stringify(
                        form.items.map(
                          pick("barcode", "description", "id", "quantity")
                        )
                      )
                    );
                    toast("Items copied");
                  },
                })
              ),
              nullIf(
                !disabled && waiting,
                button("Duplicate this form", {
                  onClick: () => onNewForm(form.duplicate()),
                })
              ),
              nullIf(
                disabled && !waiting,
                button("Delete this form", {
                  class: "create",
                  disabled: disabled || waiting || form.isBlank,
                  onClick: () => onDelete(form),
                })
              ),
              br(),
              button("Previous form", {
                onClick: () => onFormNavigation({ form, previous: true }),
                disabled: waiting,
              }),
              button("Next form", {
                onClick: () => onFormNavigation({ form }),
                disabled: waiting,
              }),
              createElement("span", {
                textContent: formIndexDisplay,
              }),
              br(),
              button(waiting ? "Submitting..." : "Submit", {
                disabled: disabled || !savable,
                class: `buttonTight ${savable ? "create" : "action"}`,
                onClick: () => onSubmit(form),
              }),
              nullIf(
                disabled || (!form.isAdvanceBooking && !form.isBlank),
                button("Save as advance booking", {
                  class: "action buttonTight",
                  disabled:
                    (!savable && !form.isAdvanceBooking) ||
                    form.isNoShow ||
                    !form.validTime,
                  onClick: () =>
                    modal({
                      children: [
                        heading1("Save for later?"),
                        paragraph(
                          [
                            "All sign-in and check-out info will be removed. ",
                            "You can only do this with a new form.",
                          ].join(" ")
                        ),
                      ],
                      closeText: "Cancel",
                      okText: "Save as advance booking",
                      onOk: () => onSubmit(form.makeAdvanceBooking()),
                    }),
                })
              ),
              button("Undo", {
                disabled,
                onClick: () => onUndo(form),
              }),
              button("Redo", {
                disabled,
                onClick: () => onRedo(form),
              }),
              createElement("span", {
                class: "updateButtonHint",
                textContent: getUpdateButtonHint(),
              }),
              nullIf(!waiting, spinner()),
            ],
          }),
          createElement("section", {
            class: "globalnotes",
            children: form.notes.reduce((notes, note) => {
              if (tryJsonParse(note.body)) return notes;
              return [
                ...notes,
                createElement("p", {
                  textContent: `Note: [${note.author}] ${note.body}`,
                }),
              ];
            }, []),
          }),
          createElement("section", {
            children: [
              table({
                class: "staticFields",
                children: [
                  ...[
                    ["Booked Students", "bookedStudents"],
                    ["Contact", "contact"],
                    ["Project", "project"],
                    ["Analog Tape", "tape"],
                    ["Overnight Setup", "overnight"],
                  ].reduce(
                    (rows, [textContent, key]) =>
                      form[key]
                        ? [
                            ...rows,
                            createElement("tr", {
                              children: [
                                headerCell(textContent),
                                cell(form[key]),
                              ],
                            }),
                          ]
                        : rows,
                    []
                  ),
                  row(
                    headerCell("Location"),
                    form.isBlank || formInputsTouched.has("location")
                      ? cell({
                          class: !form.location ? "locationError" : "",
                          child: LocationSelect({
                            form,
                            onChange: onChangeLocation,
                          }),
                        })
                      : cell({
                          textContent: form.location,
                          class: disabled ? "" : "editable hoverBlue",
                          onClick: (_, locationDisplay) => {
                            if (disabled) return;
                            locationDisplay.parentNode.appendChild(
                              LocationSelect({
                                form,
                                onChange: onChangeLocation,
                              })
                            );
                            locationDisplay.remove();
                          },
                        })
                  ),
                  row(
                    headerCell("Start Time"),
                    form.isBlank || formInputsTouched.has("startTime")
                      ? cell({
                          children: DateTimeInput({
                            name: "start",
                            value: form.startTime,
                            onChange: onChangeTime,
                          }),
                        })
                      : cell({
                          onClick: onClickTimeDisplay({
                            name: "start",
                            value: form.startTime,
                          }),
                          textContent: form.startTime,
                          class: disabled ? "" : "editable hoverBlue",
                        })
                  ),
                  row(
                    headerCell("End Time"),
                    form.isBlank || formInputsTouched.has("endTime")
                      ? cell({
                          class: form.validTime ? "" : "validTimeError",
                          children: DateTimeInput({
                            name: "end",
                            value: form.endTime,
                            onChange: onChangeTime,
                          }),
                        })
                      : cell({
                          onClick: onClickTimeDisplay({
                            name: "end",
                            value: form.endTime,
                          }),
                          textContent: form.endTime,
                          class: [
                            form.validTime ? "" : "validTimeError",
                            disabled ? "" : "editable hoverBlue",
                          ]
                            .filter(String)
                            .join(" "),
                        })
                  ),
                ],
              }),
            ],
          }),
          createElement("section", {
            children: [
              createElement("h4", { textContent: "Students" }),
              table(
                tableHead({
                  class: "form formStudents",
                  children: [
                    row(
                      ...["Name", "NetID", "Signed In", "Signed Out"].map(
                        headerCell
                      )
                    ),
                  ],
                }),
                tableBody({
                  class: "studentList",
                  children: form.students.length
                    ? form.students.map((student) =>
                        FormStudent({
                          disabled,
                          form,
                          handleStudent,
                          handleStudentNote: () =>
                            ModalStudentNotes({
                              form,
                              student,
                              onChange,
                              userName,
                            }),
                          onChange,
                          student,
                        })
                      )
                    : [
                        nullIf(
                          disabled,
                          row({
                            class: "addStudentHint",
                            child: cell({
                              colspan: 4,
                              textContent: "Scan ID to sign in a student",
                            }),
                            onClick: () => showOmniboxTip(),
                          })
                        ),
                      ],
                })
              ),
            ],
          }),
          createElement("section", {
            children: [
              createElement("h4", {
                textContent: "Equipment Checked Out",
              }),
              table(
                tableHead({
                  class: "form formItems",
                  children: [
                    row(
                      ...[
                        ["Qty", "quantity"],
                        ["Items", "description"],
                        ["Item ID", "id"],
                        ["Checked Out", "timeCheckedOutByClient"],
                        ["Checked In", "timeCheckedInByClient"],
                      ].map(([textContent, key]) =>
                        headerCell({
                          textContent,
                          class: [
                            "hoverBlue",
                            key === itemSort
                              ? `sortedBy ${
                                  itemSortAscending ? "" : "descending"
                                }`
                              : "",
                          ].join(" "),
                          onClick: () => onSortItems(key, form),
                        })
                      )
                    ),
                  ],
                }),
                // items reserved
                nullIf(
                  !itemsReserved.length,
                  tableBody({
                    children: [
                      FormItemSectionHeader("Reserved items"),
                      ...applySort(itemsReserved)
                        .map((items) =>
                          FormItem({
                            disabled,
                            form,
                            items,
                            onChange,
                            onClickItem,
                          })
                        )
                        .flat(),
                    ],
                  })
                ),
                // items staged for check-out
                tableBody({
                  class: "itemList itemsNotSaved",
                  children: itemsStagedForOut.length
                    ? [
                        FormItemSectionHeader("Checking out"),
                        ...applySort(itemsStagedForOut)
                          .map((items) =>
                            FormItem({
                              disabled,
                              form,
                              items,
                              onChange,
                              onClickItem,
                            })
                          )
                          .flat(),
                      ]
                    : [
                        nullIf(
                          disabled,
                          row(
                            cell({
                              textContent: "Scan barcode to check out an item",
                              colspan: 5,
                              onClick: () => showOmniboxTip(),
                            })
                          )
                        ),
                      ],
                }),
                nullIf(
                  !itemsStagedForIn.length,
                  tableBody({
                    class: "itemList itemsNotSaved",
                    children: [
                      FormItemSectionHeader("Checking In"),
                      ...applySort(itemsStagedForIn)
                        .map((items) =>
                          FormItem({
                            disabled,
                            form,
                            items,
                            onChange,
                            onClickItem,
                          })
                        )
                        .flat(),
                    ],
                  })
                ),
                nullIf(
                  !itemsOut.length,
                  tableBody({
                    class: "itemList itemsOut",
                    children: [
                      FormItemSectionHeader("Checked out"),
                      ...applySort(itemsOut)
                        .map((items) =>
                          FormItem({
                            disabled,
                            form,
                            items,
                            onChange,
                            onClickItem,
                          })
                        )
                        .flat(),
                    ],
                  })
                ),
                nullIf(
                  !itemsIn.length,
                  tableBody({
                    class: "itemList itemsIn",
                    children: [
                      FormItemSectionHeader("Checked In"),
                      ...applySort(itemsIn)
                        .map((items) =>
                          FormItem({
                            disabled,
                            form,
                            items,
                            onChange,
                            onClickItem,
                          })
                        )
                        .flat(),
                    ],
                  })
                )
              ),
            ],
          }),
        ],
      }),
    ],
    onKeydown: (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        onSubmit(form);
      }
    },
  });

  //---- Functions

  function applySort(items) {
    return applyTo(sort(items, (a, b) => getItemSortFn(itemSort)(a[0], b[0])))(
      itemSortAscending ? identity : reverse
    );
  }

  function getItemSortFn(name) {
    return {
      timeCheckedOutByClient: compareKey(name, compareDateStrings),
      timeCheckedInByClient: compareKey(name, compareDateStrings),
      id: compareKey(name, compareStrings),
      quantity: compareKey(name, compareStrings),
      description: compareKey(name, compareStrings),
    }[name];
  }

  function getUpdateButtonHint() {
    if (waiting) return "Please wait while the form is being saved...";
    if (disabled) return "This is a closed form. You cannot edit it.";
    if (form.isBlank && savable) return "Click submit to save this form.";
    if (!form.isBlank && saved) return "All changes saved.";
  }

  function handleItem(itemFromInventory) {
    const itemOnForm = form.items.find((item) =>
      Item.similar(item, itemFromInventory)
    );
    if (itemOnForm && itemOnForm.serialized && !itemOnForm.isIn)
      return handleItemOnForm(itemOnForm);

    return onChange({
      form: new Form({
        ...form,
        items: [
          ...form.items,
          new Item({
            ...itemFromInventory,
            timeCheckedOutByClient: getFormattedDateTime(new Date()),
          }),
        ],
      }),
      change: {
        target: {
          name: "items",
          value: itemFromInventory.id || itemFromInventory.description,
        },
      },
    });
  }

  function handleItemArray(items) {
    const compareItem = (itemA) => (itemB) => Item.similar(itemA, itemB);
    const rejected = items.filter(
      (item) =>
        !Item.isManualEntryId(item.id) && !inventory.find(compareItem(item))
    );
    if (rejected.length) {
      return modal({
        children: [
          paragraph(
            [
              "Data corrupted: could not find one or more items in inventory",
              "(listed below). Please manually enter your items.",
            ].join(" ")
          ),
          table(...rejected.map(({ description }) => row(cell(description)))),
        ],
      });
    }
    const alreadyOnForm = items.filter((item) =>
      form.items.find(compareItem(item))
    );
    if (alreadyOnForm.length) {
      return modal({
        children: [
          paragraph(
            [
              "Some items entered are already on this form (listed below).",
              "Not sure if you want to check in or out these items.",
              "Please manually enter your items instead.",
            ].join(" ")
          ),
          table(
            ...alreadyOnForm.map(({ description }) => row(cell(description)))
          ),
        ],
      });
    }
    onChange({
      form: new Form({
        ...form,
        items: [
          ...form.items,
          ...items.map(
            (item) =>
              new Item({
                ...item,
                timeCheckedOutByClient: getFormattedDateTime(new Date()),
              })
          ),
        ],
      }),
      change: {
        target: { name: "items", value: "bulk entry" },
      },
    });
  }

  // only for serialized items that are not checked-in
  function handleItemOnForm(item) {
    const change = {
      target: {
        name: "items",
        value: item.id || item.description,
      },
    };

    if (item.reserved)
      return onChange({
        form: new Form({
          ...form,
          items: replace(
            form.items,
            is(item),
            new Item({
              ...item,
              timeCheckedOutByClient: getFormattedDateTime(new Date()),
            })
          ),
        }),
        change,
      });

    if (item.stagedForOut || item.stagedForIn)
      return modal({
        children: [paragraph("You already have that item on the form.")],
      });

    if (item.isOut)
      return onChange({
        form: new Form({
          ...form,
          items: replace(
            form.items,
            is(item),
            new Item({
              ...item,
              timeCheckedInByClient: getFormattedDateTime(new Date()),
              missing: false,
            })
          ),
        }),
        change,
      });
  }

  function handleStudent(studentFromRoster) {
    const change = {
      target: {
        name: "students",
        value: studentFromRoster.name,
      },
    };

    const studentOnForm = form.students.find(
      ({ netId }) => netId === studentFromRoster.netId
    );
    // adding a student for the first time
    if (!studentOnForm) {
      if (!studentFromRoster.signatureOnFile)
        return onNeedsSignature({
          handleStudent,
          form,
          netId: studentFromRoster.netId,
        });
      change.target.value += " check-in";
      return onChange({
        form: new Form({
          ...form,
          students: [
            ...form.students,
            {
              ...studentFromRoster,
              timeSignedInByClient: getFormattedDateTime(new Date()),
            },
          ],
        }),
        change,
      });
    }
    // checking-in a student on an advance booking form
    if (!studentOnForm.timeSignedInByClient) {
      if (!studentFromRoster.signatureOnFile)
        return onNeedsSignature({
          netId: studentFromRoster.netId,
          form,
          handleStudent,
        });
      change.target.value += " advance booking check-in";
      return onChange({
        form: new Form({
          ...form,
          students: replace(form.students, is(studentOnForm), {
            ...studentOnForm,
            timeSignedInByClient: getFormattedDateTime(new Date()),
          }),
        }),
        change,
      });
    }
    // odd case: student has checked-out.  Ask if this is to check-in again.
    if (
      studentOnForm.timeSignedInByClient &&
      studentOnForm.timeSignedOutByClient
    ) {
      change.target.value += " check-in again";
      return modal({
        children: [
          heading1("Check in again?"),
          paragraph(
            "We already have a check-out (end) time for this person. " +
              "Are they not done?"
          ),
        ],
        okText: "Activate again",
        onOk: () =>
          onChange({
            form: new Form({
              ...form,
              students: replace(form.students, is(studentOnForm), {
                ...studentOnForm,
                timeSignedOutByClient: "",
              }),
            }),
            change,
          }),
      });
    }
    // student is checking-out.
    if (studentOnForm.timeSignedInByClient) {
      if (form.hasItemsOut) {
        return modal({
          children: [
            heading1("Items are still checked out"),
            paragraph("Cannot check out until all gear is returned."),
          ],
        });
      }
      change.target.value += " check-out";
      return onChange({
        form: new Form({
          ...form,
          students: replace(form.students, is(studentOnForm), {
            ...studentOnForm,
            timeSignedOutByClient: getFormattedDateTime(new Date()),
          }),
        }),
        change,
      });
    }
    // TODO: this state should be unreachable. Is it?
    modal({
      children: [
        heading1("Error"),
        paragraph(
          `Hmm, not sure what to do with ${
            studentFromRoster.name || studentFromRoster.netId
          }`
        ),
      ],
    });
  }

  function onChangeLocation(change) {
    if (change.target.value === "Other")
      return ModalNewLocation({ onChangeLocation });
    onChange({
      form: new Form({ ...form, location: change.target.value }),
      change,
    });
  }

  function onChangeTime({ name: _name, values }) {
    const name = `${_name}Time`;
    const { date, hour, minutes, ampm } = values;
    const [year, month, day] = date.split("-");
    const value = `${month}/${day}/${year} ${hour}:${String(minutes).padStart(
      "0",
      2
    )} ${ampm}`;
    if (isNaN(new Date(value).valueOf()))
      return modal({
        children: [
          heading1("Error"),
          paragraph(`The value for ${_name} time is not a valid date`),
        ],
      });
    onChange({
      form: new Form(
        form.isBlank &&
        name === "startTime" &&
        !formInputsTouched.has("endTime")
          ? {
              ...form,
              startTime: value,
              endTime: getFormattedDateTime(addOneHour(new Date(value))),
            }
          : { ...form, [name]: value }
      ),
      change: { target: { name, value } },
    });
  }

  function onClickItem({ ctrlKey, metaKey, target }, item) {
    if (disabled || ["button", "select"].includes(target.tagName.toLowerCase()))
      return;
    if (ctrlKey || metaKey) return handleItemOnForm(item);
    ModalItemNotes({ form, item, onChange });
  }

  function onClickTimeDisplay({ name, value }) {
    return (_, timeDisplay) => {
      if (disabled) return;
      timeDisplay.textContent = "";
      DateTimeInput({
        name,
        value,
        onChange: onChangeTime,
      }).forEach((el) => timeDisplay.parentNode.appendChild(el));
      timeDisplay.remove();
    };
  }

  function onManualEntry(item) {
    onChange({
      form: new Form({
        ...form,
        items: [
          ...form.items,
          new Item({
            ...item,
            timeCheckedOutByClient: getFormattedDateTime(new Date()),
          }),
        ],
      }),
      change: {
        target: {
          name: "items",
          value: item.description,
        },
      },
    });
  }

  function onOmniboxSubmit({ type, value, onOmniboxSubmit }) {
    switch (type) {
      case "itemArray":
        return handleItemArray(value);
      case "item":
        return handleItem(value);
      case "student":
        return handleStudent(value);
      case "newCodabar":
        return ModalNewCodabar({
          codabar: value,
          roster,
          onSubmit: ({ netId, codabar }) =>
            onNewCodabar({ netId, codabar, handleStudent }),
        });
      case "manualEntry":
        return ModalManualEntry({ onSubmit: onManualEntry });
      case "query":
        return ModalQuery({
          inventory,
          onOmniboxSubmit,
          roster,
          value,
        });
      default:
        modal({
          children: [heading1("Error"), paragraph(`Unknown type: ${type}`)],
        });
    }
  }

  // to show user where enter barcodes to add items
  function showOmniboxTip() {
    tip({
      element: document.querySelector(".omnibox"),
      message: "Use the text box to enter barcodes and scan IDs.",
      onClose: () => document.querySelector(".omnibox").focus(),
    });
  }
}
