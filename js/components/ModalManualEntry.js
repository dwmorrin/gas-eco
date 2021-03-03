  /* global HTML Item Utility */
  /* exported ModalManualEntry */
  function ModalManualEntry({ onSubmit }) {
    const { createElement, heading1, paragraph, modal } = HTML;
    const { digestMessage } = Utility;
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
