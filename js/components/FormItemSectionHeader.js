import { cell, row } from "../HTML";

export default function FormItemSectionHeader(textContent) {
  return row(
    cell({
      class: "itemsSectionHeader",
      textContent,
      colspan: 5,
    })
  );
}
