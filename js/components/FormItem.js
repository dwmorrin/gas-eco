import { cell, createElement, row } from "../HTML";
import CheckInButton from "./CheckInButton";
import CheckOutButton from "./CheckOutButton";
import QuantityButtons from "./QuantityButtons";

/**
 * FormItem can represent a single item or a collection of nonserialized items
 * It takes an array of items that are assumed to be similar
 */
export default function FormItem({
  disabled,
  form,
  items,
  onChange,
  onClickItem,
}) {
  // take the first item as the representative slice for detail info
  const [item] = items;
  const quantity = items.length;
  return [
    row({
      class: [
        item.serialized ? "serialized" : "nonserialized",
        disabled ? "" : "hoverBlue",
      ].join(" "),
      children: [
        cell({
          child: QuantityButtons({
            form,
            item,
            disabled,
            onChange,
            quantity,
          }),
        }),
        cell(item.description),
        cell(item.id),
        cell(
          item.timeCheckedOutByClient
            ? item.timeCheckedOutByClient
            : {
                child: item.serialized
                  ? createElement("i", {
                      textContent: "Scan barcode to check out",
                    })
                  : CheckOutButton({ form, item, onChange }),
              }
        ),
        cell({
          child: CheckInButton({ form, item, disabled, onChange, quantity }),
        }),
      ],
      onClick: (event) => onClickItem(event, item),
    }),
    row({
      class: disabled ? "" : "hoverBlue",
      child: cell({
        colspan: 5,
        class: "itemnotes",
        textContent: "Notes: " + item.notes,
        onClick: (event) => onClickItem(event, item),
      }),
    }),
  ];
}
