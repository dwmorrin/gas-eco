import { cell, documentIcon, row, tableBody } from "../HTML";

export default function OpenFormsTable({ openForms, showFormPage }) {
  return tableBody({
    children: openForms.map((form) =>
      row({
        class: `${getFormStatus(form)} hoverBackgroundCyan`,
        children: [
          cell({ child: documentIcon() }),
          ...[
            form.startTime,
            form.endTime,
            form.location,
            form.bookedStudents ||
              form.students.map((student) => student.name).join(", "),
          ].map((textContent) => cell({ textContent })),
        ],
        onClick: () => showFormPage({ form }),
      })
    ),
  });

  function getFormStatus(form) {
    const endTime = new Date(form.endTime).getTime(),
      fifteenMinutes = 15 * 60 * 1000, // milliseconds
      now = Date.now();
    // determine if active, ending soon, or late (green, yellow, red)
    if (form.students.some((student) => student.timeSignedInByClient)) {
      if (now > endTime) {
        return "late";
      }
      if (now > endTime - fifteenMinutes) {
        return "endingSoon";
      }
      return "active";
    }
    return "inactive";
  }
}
