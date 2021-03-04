/**
 * event handling:
 *   attrs["onX"], where "X" is some event name (e.g. "onClick")
 *   accepts a function that will receive the event object as argument 1
 *   and the HTMLElement as argument 2.
 *
 * children:
 *   any falsy value will be skipped (for conditional rendering)
 * @param {HTMLElement} el
 * @param {ElementCreationOptions} attrs
 */
function attributes(el, attrs) {
  try {
    for (const key in attrs) {
      if (key === "class")
        attrs[key] && el.classList.add(...attrs[key].trim().split(/\s+/));
      else if (key === "child") el.appendChild(attrs[key]);
      else if (key === "children")
        attrs[key].forEach((child) => child && el.appendChild(child));
      else if (key === "innerHTML") el.innerHTML = attrs[key];
      else if (key === "textContent") el.textContent = attrs[key];
      else if (/^on[A-Z]/.test(key))
        // onClick, onKeydown, etc
        attrs[key] &&
          el.addEventListener(
            key.replace(/^on([A-Z])/, (_, c) => c.toLowerCase()),
            (event) => attrs[key](event, el)
          );
      else if (["selected", "checked", "disabled"].includes(key))
        // only create attribute if true
        attrs[key] && el.setAttribute(key, attrs[key]);
      else el.setAttribute(key, attrs[key]);
    }
    return el;
  } catch (error) {
    console.group();
    console.log("Hit an error while making an element");
    console.log({ error, el, attrs });
    console.groupEnd();
  }
}

/**
 * HTML break tag.
 */
function br() {
  return createElement("br");
}

/**
 * For overloaded macros: row(HtmlEl, HtmlEl, ...) or row({class: "foo"})
 * This is library glue and should not be exported.
 * @param {string} tagName
 * @param {HTMLElement[]|[ElementCreationOptions]} args
 * @private
 */
function childrenShorthand(tagName, args) {
  return createElement(
    tagName,
    args[0] instanceof HTMLElement || args[0] === null
      ? { children: args }
      : args[0]
  );
}

/**
 * @param {string} name
 * @param {ElementCreationOptions} attrs
 * @returns {HTMLElement}
 */
function createElement(name, attrs = {}) {
  return attributes(document.createElement(name), attrs);
}

/**
 * Creates an img element containing data for a small (16x16) document icon.
 */
function documentIcon() {
  return createElement("img", {
    src:
      "data:image/png;base64," +
      "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABCElEQVR4XmNgoCbQ0tJiU5S" +
      "Vb1aUl2+BYSU5hU5FWUU3dLVYgYKCgoCCnPxROTk5LSDbAITl5eUVFeXkPyjKyYWiq8cAIA" +
      "OU5OXXo4sDDfgFxJ+U5OSc0eVQAMgARTmFVUCFPgpycnlKsvJFKioqfEDN/6H4L1DOBV0fH" +
      "IC9ICu/VklJSQ7odENlOTljqLgGkK8J8hrQkNfo+uAA4gL5RUBX7ALS/9DwfwVZBX8g/QNd" +
      "HxxADVijJCOjCww0V2QM1OwOlOcAyv9E1wcH1DKAMi8gByIaNgKpIcIFiGhExkqyCoVAeQk" +
      "iDJBfjS6ODPAaoCUqygNU8BLogSfYMFDuKTCp30HXN7AAAKarYBD/VuTqAAAAAElFTkSuQm" +
      "CC",
    width: "16",
    height: "16",
  });
}

/**
 * @param {HTMLElement} el
 */
function empty(el) {
  while (el && el.firstChild) el.removeChild(el.firstChild);
}

/**
 * @param {string} name
 * @returns {(textContent: string, value: string, checked: boolean?) => HTMLElement}
 */
function labeledRadio(name) {
  return (textContent, value, checked = false) =>
    createElement("label", {
      textContent,
      child: createElement("input", {
        type: "radio",
        name,
        value,
        checked,
      }),
    });
}

/**
 * @param {string} name
 * @returns {(value: string, checked: boolean?) => HTMLElement}
 */
function radio(name) {
  return (value, checked = false) =>
    createElement("input", {
      type: "radio",
      name,
      value,
      checked,
    });
}

/**
 * Helper function to query a given container for all radio elements
 * and return the value of the first checked element found,
 * or null if no checked elements can be found.
 * @param {HTMLElement} container defaults to document
 * @returns {string | null} value of first checked element found
 */
function getRadioValue(container = document) {
  const found = Array.from(
    container.querySelectorAll('input[type="radio"]')
  ).find((el) => el.checked);
  return found ? found.value : null;
}

/**
 * Creates a div.spinner element, see spinner class in css
 */
function spinner() {
  return createElement("div", { class: "spinner" });
}

/**
 * @param  {HTMLElement[]} args
 */
function table(...args) {
  return childrenShorthand("table", args);
}

/**
 * @param {ElementCreationOptions} attrs
 */
function tableBody(attrs) {
  return createElement("tbody", attrs);
}

/**
 * @param {ElementCreationOptions} attrs
 */
function tableHead(attrs) {
  return createElement("thead", attrs);
}

/**
 * @param  {HTMLElement[]} args
 */
function row(...args) {
  return childrenShorthand("tr", args);
}

/**
 * @param {ElementCreationOptions} attrs
 */
function headerCell(attrs) {
  return stringShorthand("th", attrs);
}

/**
 * @param {ElementCreationOptions} attrs
 */
function cell(attrs) {
  return stringShorthand("td", attrs);
}

/**
 * @param {string} textContent
 * @param {string} value
 */
function option(textContent, value) {
  if (value === undefined) value = textContent;
  return createElement("option", { textContent, value });
}

/**
 * @param {string} tagName
 * @param {ElementCreationOptions} attrs
 */
function stringShorthand(tagName, attrs) {
  if (typeof attrs === "string")
    return createElement(tagName, { textContent: attrs });
  else return createElement(tagName, attrs);
}

/**
 * @param {{element: HTMLElement, message: string, onClose: () => unknown}} param0
 */
function tip({ element, message, onClose }) {
  const blockers = blockAround(element);
  const div = createElement("p", {
    class: "tip",
    textContent: message,
  });
  document.body.appendChild(div);
  const { top, right } = element.getBoundingClientRect();
  div.style.top = `${top}px`;
  div.style.left = `${right}px`;
  const cleanup = (event) => {
    event.preventDefault();
    div.remove();
    blockers.forEach((blocker) => blocker.remove());
    window.removeEventListener("mousedown", cleanup);
    window.removeEventListener("keydown", cleanup);
    onClose();
  };
  window.addEventListener("mousedown", cleanup);
  window.addEventListener("keydown", cleanup);
}

/**
 * @param {HTMLElement} element
 */
function blockAround(element) {
  const { top, bottom, width, left } = element.getBoundingClientRect();
  const divs = [
    createElement("div", {
      class: "blockAround",
      style: `top: 0; height: ${top}px; left: ${left}px; width: ${width}px`,
    }),
    createElement("div", {
      class: "blockAround",
      style: `top: ${bottom}px; bottom: 0px; left: ${left}px; width: ${width}px`,
    }),
    createElement("div", {
      class: "blockAround",
      style: `top: 0; bottom: 0px; left: 0; width: ${left}px`,
    }),
    createElement("div", {
      class: "blockAround",
      style: `top: 0; bottom: 0px; left: ${left + width}px; right: 0px`,
    }),
  ];
  divs.forEach((div) => document.body.appendChild(div));
  return divs;
}

/**
 * Creates a modal UI element.
 * WARNING: side-effect by default: will append element to document.body.
 * Side-effect can be turned off with appendToBody = false.
 * @param {{
 *   child: HTMLElement,
 *   children: HTMLElement[],
 *   innerHTML: string,
 *   onClick: (e: MouseEvent) => unknown,
 *   onClose: () => unknown,
 *   onOk: () => unknown | null,
 *   okText: string,
 *   blocking: boolean,
 *   appendToBody: boolean
 * }} props
 */
function modal({
  child,
  children,
  innerHTML,
  onClick,
  onClose = () => undefined,
  closeText = "Close",
  onOk = null,
  okText = "Ok",
  blocking = true,
  appendToBody = true,
}) {
  const div = createElement("div", { class: "modal" });
  const buttonDiv = createElement("div");
  if (innerHTML) div.innerHTML = innerHTML;
  if (child) div.appendChild(child);
  if (children) children.forEach((child) => div.appendChild(child));
  const blocker = blocking ? createElement("div", { class: "overlay" }) : null;
  const cleanup = () => {
    div.remove();
    blocker && blocker.remove();
  };
  const remove = () => {
    onClose();
    cleanup();
  };
  if (onClick)
    // for children to determine when cleanup occurs
    div.addEventListener("click", (event) => onClick({ event, cleanup }));
  const closeButton = createElement("button", {
    textContent: closeText,
    onClick: remove,
  });
  if (typeof onOk === "function") {
    const okButton = createElement("button", {
      class: "create",
      textContent: okText,
      onClick: () => {
        onOk({ modal: div });
        cleanup();
      },
    });
    buttonDiv.appendChild(okButton);
  }
  div.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cleanup();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onOk({ modal: div });
      cleanup();
    }
  });
  buttonDiv.appendChild(closeButton);
  div.appendChild(buttonDiv);
  blocker && document.body.appendChild(blocker);
  appendToBody && document.body.appendChild(div);
  closeButton.focus();
  return { element: div, remove };
}

/**
 * @param {string} textContent
 * @param {ElementCreationOptions} attrs
 */
function heading1(textContent, attrs = {}) {
  return createElement("h1", { ...attrs, textContent });
}

/**
 * @param {string} textContent
 * @param {ElementCreationOptions} attrs
 */
function paragraph(textContent, attrs = {}) {
  return createElement("p", { ...attrs, textContent });
}

/**
 * @param {string} textContent
 */
function toast(textContent) {
  const container = createElement("div", {
    class: "toast",
    textContent,
  });
  document.body.appendChild(container);
  window.setTimeout(() => container.remove(), 5000);
}

/**
 * @param {{
 *   name: string,
 *   children: HTMLElement[],
 *   onClick: (MouseEvent) => unknown,
 *   onKeydown: (KeyboardEvent) => unknown
 * }} props
 */
function page({ name, children, onClick, onKeydown }) {
  const div = createElement("div", {
    class: `${name}Container`,
    children,
    onClick,
    onKeydown,
  });
  return div;
}

/**
 * @param {string} textContent
 * @param {ElementCreationOptions} inputAttrs
 */
function labeledInput(textContent, inputAttrs = {}) {
  return createElement("label", {
    textContent,
    child: createElement("input", inputAttrs),
  });
}

/**
 * @param {string} textContent
 * @param {string} name
 * @param {ElementCreationOptions} attrs
 */
function labeledDateInput(textContent = "", name = "", attrs = {}) {
  return labeledInput(textContent, {
    ...attrs,
    name,
    type: "date",
    placeholder: "yyyy-mm-dd",
  });
}

/**
 * @param {string} textContent
 * @param {string} name
 * @param {boolean} checked
 */
function labeledCheckbox(textContent, name, checked = false) {
  return labeledInput(textContent, { name, type: "checkbox", checked });
}

/**
 * @param {string} textContent
 * @param {ElementCreationOptions} attrs
 */
function button(textContent, attrs) {
  return createElement("button", { ...attrs, textContent });
}

/**
 * To set the value of a <select>, the options have to be attached first.
 * Children attribute must be processed before value attribute.
 * createElement does not specify order of attributes, thus this function
 * controls the processing order of the attributes.
 * @param {ElementCreationOptions} attrs
 */
function select(attrs) {
  const el = createElement("select", attrs);
  if (attrs.value) el.value = attrs.value;
  return el;
}

/**
 * Side-effect: empties node, replaces with newChild
 * @param {HTMLElement} node
 * @param {HTMLElement} newChild
 */
function update(node, newChild) {
  empty(node);
  node.appendChild(newChild);
  return node;
}

export {
  br,
  button,
  cell,
  createElement,
  documentIcon,
  getRadioValue,
  headerCell,
  heading1,
  labeledCheckbox,
  labeledDateInput,
  labeledInput,
  labeledRadio,
  modal,
  option,
  page,
  paragraph,
  radio,
  row,
  select,
  spinner,
  table,
  tableBody,
  tableHead,
  tip,
  toast,
  update,
};
