import { cell, createElement, tableBody } from "../HTML";
import {
  compareDateStrings,
  compareKey,
  compareStrings,
  sort,
  reverse,
} from "../Utility";

export default function EquipmentOutTable({
  itemsOutSort,
  itemsOutSortAscending,
  openForms,
  showFormPage,
}) {
  const checkedOutItems = sort(
    openForms.reduce(
      (openFormItems, form) => [
        ...openFormItems,
        ...form.items.reduce(
          (items, item) =>
            item.serialized && item.isOut
              ? [
                  ...items,
                  {
                    location: form.location,
                    students: form.students,
                    endTime: form.endTime,
                    formId: form.id,
                    ...item,
                  },
                ]
              : items,
          []
        ),
      ],
      []
    ),
    compareKey(
      itemsOutSort,
      {
        description: compareStrings,
        id: compareStrings,
        location: compareStrings,
        students: () => 0,
        endTime: compareDateStrings,
      }[itemsOutSort]
    )
  );

  const children = (itemsOutSortAscending
    ? checkedOutItems
    : reverse(checkedOutItems)
  ).map(itemToRow);

  return tableBody({
    children,
  });

  function itemToRow({
    description,
    endTime,
    barcode,
    location,
    students,
    id,
    formId,
  }) {
    return createElement("tr", {
      class: "hoverBackgroundCyan",
      onClick: () =>
        showFormPage({ form: openForms.find(({ id }) => id === formId) }),
      children: [
        cell(description),
        cell(id || barcode || ""),
        cell(location),
        cell(
          students.reduce((names, { name }) => [...names, name], []).join(", ")
        ),
        cell(endTime),
      ],
    });
  }
}
