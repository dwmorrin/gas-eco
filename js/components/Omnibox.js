import { button, createElement, heading1, modal, paragraph } from "../HTML";
import { tryJsonParse } from "../Utility";
import { getByBarcode, getById } from "../Inventory";
import Item from "../Item";

export default function Omnibox({
  disabled,
  form,
  inventory,
  onSubmit,
  roster,
}) {
  const input = createElement("input", {
    disabled,
    type: "text",
    class: "omnibox",
    placeholder: "Scan barcode or search",
    onKeydown: (event, el) => {
      const { metaKey, ctrlKey, key } = event;
      if (!metaKey && !ctrlKey && key === "Enter") {
        event.preventDefault();
        onOmniboxSubmit();
      } else if (key === "Escape") el.blur();
    },
  });

  return createElement("span", {
    children: [
      input,
      button("🔎", {
        class: "buttonSmall",
        disabled,
        tabindex: -1,
        onClick: () => onOmniboxSubmit(),
      }),
    ],
  });

  /**
   * @param {number|string|undefined} injectedValue for query results
   */
  function onOmniboxSubmit(injectedValue) {
    if (["string", "number"].includes(typeof injectedValue))
      input.value = injectedValue;
    const { type, value, error } = parse(input);
    if (error)
      return modal({
        children: [heading1("Error"), paragraph(error.message)],
      });
    onSubmit({ type, value, onOmniboxSubmit });
  }

  /**
   * parse examines the current value of the omnibox text input element
   * and returns an object that should always be checked for an error key.
   * {
   *   type?: "itemArray" |
   *               "item" |
   *            "student" |
   *         "newCodabar" | // codabar detected but not found in roster
   *        "manualEntry" | // magic number for manual item entry detected
   *              "query",  // no exact match; search through roster & inventory
   *   value?: Item[] | Item | Student | string,
   *   error?: Error,
   * }
   */
  function parse(element) {
    if (!element.value)
      return { error: new Error("Enter a barcode, item ID, NetID, or name") };

    // see the "Copy items to clipboard" button
    if (/^\s*\[\s*{\s*"/.test(element.value)) {
      // JSON array of objects: "[{}]"
      const items = tryJsonParse(element.value);
      if (!items || !Array.isArray(items))
        return {
          type: "itemArray",
          error: new Error("Input appears to be JSON but I couldn't parse it."),
        };
      return { type: "itemArray", value: items };
    }

    const value = element.value.toLowerCase(); // case insensitive input
    const codabarRegex = /^[a-d][0-9]{5,}[a-d]$/; // "a123...789b" pattern
    if (codabarRegex.test(value)) {
      // Check student id
      const foundStudent = roster.find(({ id }) => id.toLowerCase() == value);
      if (foundStudent) {
        return { type: "student", value: foundStudent };
      }
      return { type: "newCodabar", value };
    }

    const idType = /^[a-z]+[0-9]+/.test(value) ? "netId" : "name"; // Check student name and id
    const foundStudent = roster.find(
      (student) => student[idType].toLowerCase() === value
    );
    if (foundStudent) {
      return { type: "student", value: foundStudent };
    }

    // two special cases: magic number for manual entry and generated "manual" IDs
    if (value === "10000") {
      return { type: "manualEntry" };
    }
    if (Item.isManualEntryId(value))
      return {
        type: "item",
        value: new Item(
          form.items.find(
            ({ id }) => id.toLowerCase().replace(/-0+/, "-") === value
          )
        ),
      };

    const foundItem =
      getById(inventory, value) || getByBarcode(inventory, value);
    if (foundItem) return { type: "item", value: foundItem };

    return { type: "query", value: element.value };
  }
}
