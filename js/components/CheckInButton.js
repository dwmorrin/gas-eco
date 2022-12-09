import { getFormattedDateTime } from "../DateUtils";
import { createElement } from "../HTML";
import { is, range, replace } from "../Utility";
import Form from "../Form";
import Item from "../Item";

export default function CheckInButton({
  form,
  item,
  disabled,
  onChange,
  quantity,
}) {
  if (item.missing) {
    return createElement("span", {
      class: "alert",
      textContent: "ITEM IS MISSING",
    });
  }

  if (disabled || item.stagedForIn || item.isIn) {
    return document.createTextNode(item.timeCheckedInByClient);
  }

  if (item.stagedForOut || item.reserved) {
    return createElement("button", {
      class: "create",
      textContent: "Remove",
      onClick: () => {
        onChange({
          form: new Form({
            ...form,
            items: form.items.filter(
              (i) =>
                (item.stagedForOut && !i.stagedForOut) ||
                (item.reserved && !i.reserved) ||
                !Item.similar(item, i)
            ),
          }),
          change: {
            target: {
              name: "items",
              value: item.description + " removed",
            },
          },
        });
      },
    });
  }

  // item must be checked out
  if (quantity > 1) {
    const quantitySelect = createElement("select", {
      class: "selectQuantity",
      children: [
        createElement("option", {
          value: quantity,
          textContent: "All",
        }),
        ...Array.from({ length: quantity - 1 }).map((_, i) =>
          createElement("option", {
            textContent: String(i + 1),
          })
        ),
      ],
    });
    return createElement("span", {
      children: [
        createElement("button", {
          class: "action",
          textContent: "Check In",
          onClick: () =>
            onChange({
              form: new Form({
                ...form,
                items: [
                  // all the not similar items
                  ...form.items.filter(
                    (i) => !i.isOut || !Item.similar(i, item)
                  ),
                  // similar items NOT being returned
                  ...range(quantity - quantitySelect.value).map(
                    () => new Item(item)
                  ),
                  // items being returned
                  ...range(+quantitySelect.value).map(
                    () =>
                      new Item({
                        ...item,
                        timeCheckedInByClient: getFormattedDateTime(new Date()),
                      })
                  ),
                ],
              }),
              change: {
                target: {
                  name: "items",
                  value: `${item.id || item.description} check-in ${
                    quantitySelect.value
                  }`,
                },
              },
            }),
        }),
        quantitySelect,
      ],
    });
  }

  if (item.serialized)
    return document.createTextNode("Scan barcode to check-in");

  return createElement("button", {
    class: "action",
    textContent: "Check In",
    onClick: () =>
      onChange({
        form: new Form({
          ...form,
          items: replace(
            form.items,
            is(item),
            new Item({
              ...item,
              timeCheckedInByClient: getFormattedDateTime(new Date()),
            })
          ),
        }),
        change: {
          target: {
            name: "items",
            value: `${item.id || item.description} check-in`,
          },
        },
      }),
  });
}
