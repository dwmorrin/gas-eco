import { createElement, heading1, modal, paragraph } from "../HTML";
import Form from "../Form";
import Item from "../Item";

export default function ModalItemNotes({ form, item, onChange }) {
  const missingInput = createElement("input", {
    type: "checkbox",
    name: "missing",
    checked: item.missing,
  });

  const notesInput = createElement("textarea", {
    textContent: item.notes,
  });

  const { description, id } = item;

  modal({
    children: [
      heading1("Add notes to item"),
      paragraph(description + (id ? `(${id})` : "")),
      notesInput,
      createElement("label", {
        textContent: "Item is missing",
        child: missingInput,
      }),
    ],
    okText: "Add notes",
    onOk: () =>
      onChange({
        form: new Form({
          ...form,
          items: form.items.map((i) =>
            Item.similar(i, item)
              ? new Item({
                  ...item,
                  missing: missingInput.checked,
                  notes: notesInput.value,
                })
              : i
          ),
        }),
        change: {
          target: {
            name: "items",
            value: `${item.id || item.description} note: ${notesInput.value}`,
          },
        },
      }),
  });
  notesInput.focus();
}
