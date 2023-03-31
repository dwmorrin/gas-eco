import { heading1, modal } from "../HTML";

export default function ModalManualWarning({ onOk }) {
  modal({
    children: [heading1("Please use the scanner.")],
    okText: "I accept the consequences for this manual entry.",
    onOk,
  });
}
