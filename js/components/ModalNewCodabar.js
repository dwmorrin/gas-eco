import { createElement, heading1, paragraph, modal } from "../HTML";

export default function ModalNewCodabar({ codabar, roster, onSubmit }) {
  const input = createElement("input", {
    value: "",
    placeholder: "enter student's NetID",
  });
  modal({
    children: [
      heading1("ID not recognized"),
      paragraph(
        "If you scanned an ID, add it to the student's info by " +
          "submitting their NetID.  If you think you are seeing this " +
          'message in error, choose "close".'
      ),
      input,
    ],
    okText: "Submit",
    onOk: () => {
      const netId = input.value;
      const student = roster.find(
        (student) => student.netId.toLowerCase() === netId
      );
      if (!student) {
        return modal({
          child: paragraph(
            `Hmmm, NetID ${netId} does not match a current student. ` +
              "Check that it was entered correctly, try refreshing the browser, " +
              "or submit a trouble report."
          ),
        });
      }
      onSubmit({ netId, codabar });
    },
  });
  input.focus();
}
