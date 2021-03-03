  /* global HTML */
  /* exported ModalQuantityChange */
  /**
   * onOk receives the input value.
   */
  function ModalQuantityChange({ item, onOk, quantity }) {
    const { createElement, modal, heading1, paragraph } = HTML;
    const newQuantityInput = createElement("input", {
      class: "newQuantity",
    });
    const { description, id } = item;
    modal({
      children: [
        heading1("Change quantity"),
        paragraph(description + (id ? `(${id})` : "")),
        paragraph(`Enter the new quantity: (current quantity: ${quantity})`),
        newQuantityInput,
      ],
      okText: "Ok",
      onOk: () => onOk(newQuantityInput.value),
    });
    newQuantityInput.focus();
  }
