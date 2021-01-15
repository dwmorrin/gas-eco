<script>
  "use strict";
  /* global env DateUtils HTML */
  /* exported ClosedFormsInputs */
  function ClosedFormsInputs({
    closedFormsQuery = {},
    onSubmit = () => undefined,
  }) {
    const {
      button,
      createElement,
      labeledCheckbox,
      labeledDateInput,
      labeledInput,
      labeledRadio,
      option,
      select,
    } = HTML;
    const { formatDashedDate } = DateUtils;
    const today = formatDashedDate(new Date());
    const {
      start = today,
      end = today,
      location = "All",
      students = "",
      items = "",
      matchItems = "any",
      isBooked = false,
      isNotBooked = false,
      isTape = false,
      byMissingItem = false,
      byLateStudents = false,
      byNoShow = false,
      byStudentLeft = false,
      byHasNotes = false,
      byHasManual = false,
    } = closedFormsQuery;
    const matchItemsRadio = labeledRadio("matchItems");
    const queryInputs = createElement("form", {
      onSubmit: (_) => _.preventDefault(),
      class: "query",
      children: [
        document.createTextNode("Start Time Range (Required):"),
        labeledDateInput("Range Start", "start", {
          value: start,
        }),
        labeledDateInput("Range End", "end", { value: end }),
        createElement("label", {
          textContent: "Location",
          child: select({
            name: "location",
            children: ["All", ...env.locations, "Other"].map((location) =>
              option(location)
            ),
            value: location,
          }),
        }),
        labeledInput("Students", {
          name: "students",
          type: "text",
          value: students,
        }),
        labeledInput("Items", { name: "items", type: "text", value: items }),
        matchItemsRadio(
          "Form has all of the items",
          "all",
          matchItems === "all"
        ),
        matchItemsRadio(
          "Form has any of the items",
          "any",
          matchItems === "any"
        ),
        ...[
          ["Booked session", "isBooked", isBooked],
          ["Not booked session", "isNotBooked", isNotBooked],
          ["Tape session", "isTape", isTape],
          ["Missing an item", "byMissingItem", byMissingItem],
          ["Late check in or out", "byLateStudents", byLateStudents],
          ["No student checked in", "byNoShow", byNoShow],
          ["Student did not check out", "byStudentLeft", byStudentLeft],
          ["Has notes", "byHasNotes", byHasNotes],
          ["Has manual entries", "byHasManual", byHasManual],
        ].map(([textContent, name, checked]) =>
          labeledCheckbox(textContent, name, checked)
        ),
        button("Update View", {
          class: "action",
          onClick: () => onSubmit(queryInputs),
        }),
      ],
    });

    return queryInputs;
  }
</script>
