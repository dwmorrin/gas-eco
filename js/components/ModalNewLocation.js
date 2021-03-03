import { createElement, modal, heading1, paragraph } from "../HTML";

export default function ModalNewLocation({ onChangeLocation }) {
  const input = createElement("input", { type: "text" });
  modal({
    children: [
      heading1("Location: Other"),
      paragraph("Location must be on the 5th or 6th floor of 370 Jay Street."),
      input,
    ],
    okText: "Set location",
    onOk: () =>
      onChangeLocation({
        target: {
          name: "location",
          value: input.value.trim(),
        },
      }),
    onClose: () =>
      onChangeLocation({
        target: { name: "location", value: "" },
      }),
  });
  input.focus();
}
