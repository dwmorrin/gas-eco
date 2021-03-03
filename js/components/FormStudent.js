import { cell, createElement } from "../HTML";

export default function FormStudent({
  disabled,
  handleStudent,
  handleStudentNote,
  student,
}) {
  return createElement("tr", {
    class: disabled ? "" : "hoverBlue",
    children: [
      cell(student.name),
      cell(student.netId),
      createElement("td", {
        child: student.timeSignedInByClient
          ? document.createTextNode(student.timeSignedInByClient)
          : disabled
          ? document.createTextNode("")
          : createElement("i", {
              textContent: "Scan ID to sign in",
            }),
      }),
      createElement("td", {
        child: student.left
          ? createElement("span", {
              class: "alert",
              textContent: "DID NOT CHECK OUT",
            })
          : student.timeSignedOutByClient
          ? document.createTextNode(student.timeSignedOutByClient)
          : disabled || !student.timeSignedInByClient
          ? document.createTextNode("")
          : createElement("i", {
              textContent: "Scan ID to sign out",
            }),
      }),
    ],
    onClick: ({ metaKey, target }) => {
      if (disabled || target.tagName.toLowerCase() === "button") return;
      if (metaKey) return handleStudent(student);
      else handleStudentNote();
    },
  });
}
