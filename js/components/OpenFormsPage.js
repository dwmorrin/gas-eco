  /* global HTML Utility OpenFormsTable EquipmentOutTable */
  /* exported OpenFormsPage */
  function OpenFormsPage({
    ascending,
    itemsOutSort,
    itemsOutSortAscending,
    openForms,
    showFormPage,
    sortedBy,
    onSortForms,
    onSortItemsOut,
  }) {
    const {
      createElement,
      documentIcon,
      headerCell,
      page,
      row,
      table,
      tableHead,
    } = HTML;
    const {
      compareDateStrings,
      compareKey,
      compareStrings,
      reverse,
      sort,
      uncamelCase,
    } = Utility;

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
            openForms: sortForms(openForms, sortedBy, ascending),
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
                        ? `sortedBy ${
                            itemsOutSortAscending ? "" : "descending"
                          }`
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
