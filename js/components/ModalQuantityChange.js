import { createElement, modal, heading1, paragraph } from "../HTML";

/**
 * onOk receives the input value.
 */
export default function ModalQuantityChange({ item, onOk, quantity }) {
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
