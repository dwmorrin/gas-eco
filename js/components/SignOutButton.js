import { getFormattedDateTime } from "../DateUtils";
import { createElement, heading1, modal, paragraph } from "../HTML";
import { is, replace } from "../Utility";
import Form from "../Form";

export default function SignOutButton({ form, student, onChange }) {
  return createElement("button", {
    textContent: "Sign Out",
    onClick: () => {
      // TODO bug: this code is duplicated in FormPage.js
      // TODO business logic: only restrict the last sign out (others can leave early)
      if (form.hasItemsOut)
        modal({
          children: [
            heading1("You have items out!"),
            paragraph("Please return all items before signing out people."),
          ],
        });
      else
        modal({
          children: [
            heading1("Sign out?"),
            paragraph(
              [
                `Manually sign out ${student.name || "(no name)"} (${
                  student.netId || "no ID"
                })?`,
                "(Scanning their ID is preferred.)",
              ].join(" ")
            ),
          ],
          okText: "Sign Out",
          onOk: () =>
            onChange({
              form: new Form({
                ...form,
                students: replace(form.students, is(student), {
                  ...student,
                  timeSignedOutByClient: getFormattedDateTime(new Date()),
                }),
              }),
              change: {
                target: {
                  name: "students",
                  value: `${student.netId} check-in`,
                },
              },
            }),
        });
    },
  });
}
