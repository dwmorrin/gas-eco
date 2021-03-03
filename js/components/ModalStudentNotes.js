import {
  cell,
  createElement,
  getRadioValue,
  heading1,
  modal,
  radio,
  row,
  table,
} from "../HTML";
import { is, nullIf, replace } from "../Utility";
import Form from "../Form";

export default function ModalStudentNotes({
  form,
  student,
  onChange,
  userName,
}) {
  const optionRadio = radio("studentOptions");
  const input = createElement("textarea");

  modal({
    children: [
      heading1("Add notes"),
      table(
        nullIf(
          student.timeSignedInByClient,
          row(
            cell("Student never showed up."),
            cell({ child: optionRadio("no show") })
          )
        ),
        nullIf(
          !student.timeSignedInByClient || student.timeSignedOutByClient,
          row(
            cell("Student left without checking out."),
            cell({ child: optionRadio("left") })
          )
        ),
        row(
          cell("Other (please specify below)"),
          cell({ child: optionRadio("other", true) })
        )
      ),
      input,
    ],
    okText: "Submit",
    onOk: ({ modal }) => {
      const choice = getRadioValue(modal);
      const textValue = input.value;

      if (choice === "left") {
        onChange({
          form: new Form({
            ...form,
            students: replace(form.students, is(student), {
              ...student,
              left: true,
            }),
          }),
          change: {
            target: {
              name: "students",
              value: `${student.name} left without checking out`,
            },
          },
        });
      } else if (choice === "no show") {
        onChange({
          form: new Form({
            ...form,
            notes: [
              ...form.notes,
              {
                timestamp: Date.now(),
                author: userName,
                body: `${student.name}: did not show up`,
              },
            ],
          }),
          change: {
            target: {
              name: "students",
              value: `${student.name} did not show up`,
            },
          },
        });
      } else if (choice === "other") {
        onChange({
          form: new Form({
            ...form,
            notes: [
              ...form.notes,
              {
                timestamp: Date.now(),
                author: userName,
                body: `${student.name}: ${textValue}`,
              },
            ],
          }),
          change: {
            target: {
              name: "notes",
              value: `${student.name}: ${textValue}`,
            },
          },
        });
      }
    },
  });
  input.focus();
}
