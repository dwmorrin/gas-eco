  "use strict";
  /* global HTML Utility */
  /* exported ClosedFormsTable */
  function ClosedFormsTable({ forms, onSort, showFormPage }) {
    const {
      cell,
      createElement,
      documentIcon,
      row,
      headerCell,
      table,
      tableBody,
      tableHead,
    } = HTML;
    const { uncamelCase } = Utility;

    return table(
      tableHead({
        child: row(
          headerCell({
            class: "closedFormsHeader documentIconHeader",
            child: documentIcon(),
          }),
          ...[
            "startTime",
            "endTime",
            "location",
            "students",
            "items",
            "bookingId",
            "bookedStudents",
            "contact",
            "project",
            "tape",
            "overnight",
          ].map((text) =>
            headerCell({
              class: "closedFormsHeader hoverBlue",
              textContent: uncamelCase(text),
              onClick: () => onSort(text),
            })
          )
        ),
      }),
      tableBody({
        children: forms.length
          ? forms.map((form) =>
              createElement("tr", {
                class: "hoverBackgroundCyan",
                onClick: () =>
                  showFormPage({ form, type: "closed", filteredForms: forms }),
                children: [
                  cell({ child: documentIcon() }),
                  ...[
                    form.startTime,
                    form.endTime,
                    form.location,
                    form.students.map((student) => student.name).join(", "),
                    form.items.length ? "YES" : "NO", // "has items"
                    form.bookingId,
                    form.bookedStudents,
                    form.contact,
                    form.project,
                    form.tape ? "YES" : "",
                    form.overnight ? "YES" : "",
                  ].map(cell),
                ],
              })
            )
          : [
              createElement("tr", {
                class: "hoverOff",
                child: createElement("td", {
                  textContent: "No forms matched your search.",
                  colspan: 12, // fill entire row
                }),
              }),
            ],
      })
    );
  }
