import {
  createElement,
  documentIcon,
  headerCell,
  page,
  row,
  table,
  tableHead,
} from "../HTML";
import { formatDashedDate } from "../DateUtils";
import {
  compareDateStrings,
  compareKey,
  compareStrings,
  reverse,
  sort,
  uncamelCase,
} from "../Utility";
import OpenFormsTable from "./OpenFormsTable";
import EquipmentOutTable from "./EquipmentOutTable";

// helper function to split forms by start date into now (or past) and future
function splitFormsIntoNowAndFuture(forms) {
  const [year, month, date] = formatDashedDate(new Date())
    .split("-")
    .map(Number);
  return forms.reduce(
    (res, form) => {
      const [formYear, formMonth, formDate] = formatDashedDate(
        new Date(form.startTime)
      )
        .split("-")
        .map(Number);
      if (
        formYear > year ||
        (formYear === year && formMonth > month) ||
        (formYear === year && formMonth === month && formDate > date)
      ) {
        res.futureForms.push(form);
      } else {
        res.todaysForms.push(form);
      }
      return res;
    },
    { todaysForms: [], futureForms: [] }
  );
}

export default function OpenFormsPage({
  ascending,
  itemsOutSort,
  itemsOutSortAscending,
  openForms,
  showFormPage,
  sortedBy,
  onSortForms,
  onSortItemsOut,
}) {
  const { todaysForms, futureForms } = splitFormsIntoNowAndFuture(openForms);
  return page({
    name: "openForms",
    children: [
      createElement("h2", { textContent: "Open Forms" }),
      createElement("h3", {
        textContent: "click on a form to view and edit",
      }),
      table(
        tableHead({
          class: "open",
          children: [
            headerCell({
              class: "documentIconHeader",
              child: documentIcon(),
            }),
            ...["startTime", "endTime", "location", "students"].map((text) =>
              headerCell({
                class: [
                  "hoverBlue",
                  text === sortedBy
                    ? ` sortedBy ${ascending ? "" : "descending"}`
                    : "",
                ].join(" "),
                onClick: () => onSortForms(text),
                textContent: uncamelCase(text),
              })
            ),
          ],
        }),
        OpenFormsTable({
          openForms: sortForms(todaysForms, sortedBy, ascending),
          showFormPage,
        })
      ),
      createElement("h2", { textContent: "Future Forms" }),
      table(
        tableHead({
          class: "open",
          children: [
            headerCell({
              class: "documentIconHeader",
              child: documentIcon(),
            }),
            ...["startTime", "endTime", "location", "students"].map((text) =>
              headerCell({
                // class: [
                //   "hoverBlue",
                //   text === sortedBy
                //     ? ` sortedBy ${ascending ? "" : "descending"}`
                //     : "",
                // ].join(" "),
                // onClick: () => onSortForms(text),
                textContent: uncamelCase(text),
              })
            ),
          ],
        }),
        OpenFormsTable({
          openForms: sortForms(futureForms, sortedBy, ascending),
          showFormPage,
        })
      ),
      createElement("h2", { textContent: "Equipment Checked Out" }),
      table(
        tableHead({
          class: "hoverBlue",
          child: row(
            ...["description", "id", "location", "students", "endTime"].map(
              (text) =>
                headerCell({
                  textContent: uncamelCase(text),
                  class:
                    text === itemsOutSort
                      ? `sortedBy ${itemsOutSortAscending ? "" : "descending"}`
                      : "",
                  onClick: () => onSortItemsOut(text),
                })
            )
          ),
        }),
        EquipmentOutTable({
          itemsOutSort,
          itemsOutSortAscending,
          openForms,
          showFormPage,
        })
      ),
    ],
  });

  function sortForms(forms, sortBy, ascending) {
    const result = sort(
      forms,
      compareKey(
        sortBy,
        {
          startTime: compareDateStrings,
          endTime: compareDateStrings,
          location: compareStrings,
          students: (a, b) => compareStrings(minName(a), minName(b)),
        }[sortBy]
      )
    );
    return ascending ? result : reverse(result);

    function minName(students) {
      return students.reduce((min, { name }) => (name < min ? name : min));
    }
  }
}
