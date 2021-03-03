import { createElement, heading1, paragraph, modal } from "../HTML";
import { digestMessage } from "../Utility";
import Item from "../Item";

export default function ModalManualEntry({ onSubmit }) {
  const input = createElement("input", { type: "text" });
  modal({
    children: [
      heading1("Check out item without barcode"),
      paragraph(
        "Describe the item: (required, provide as much detail as possible)"
      ),
      input,
    ],
    okText: "Check out",
    onClose: () => document.querySelector(".omnibox").focus(),
    onOk: () => {
      const description = input.value;
      if (description === "") {
        return;
      }
      digestMessage(description).then((hash) =>
        onSubmit(
          new Item({
            id: Item.getManualEntryId(hash),
            description,
          })
        )
      );
    },
  });
  input.focus();
}
