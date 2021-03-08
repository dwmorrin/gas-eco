import { createElement, update } from "./HTML";
import { getSequentialNumber } from "./Utility";

export default class Page {
  /**
   *
   * @param {{
   *   name: string,
   *   onShow: (state:{}, componentProps: {}) => HTMLElement,
   *   postShow: (state:{}, componentProps: {}) => void,
   *   onHide: (state:{}, componentProps: {}) => void,
   *   component: (componentProps: {}) => HTMLElement,
   *   parent: HTMLElement,
   *   usesHistory: boolean
   * }} pageProps
   */
  constructor({
    name,
    onShow,
    postShow,
    onHide,
    component,
    parent,
    usesHistory = true,
  }) {
    this.name = name || getSequentialNumber().toString();
    this.onShow = onShow || (() => {});
    this.postShow = postShow || (() => {});
    this.onHide = onHide || (() => {});
    this.component = component || (() => createElement("div"));
    this.parent = parent || document.body;
    this.usesHistory = usesHistory;
  }

  /**
   * updates parent according to state and optional component props
   * @param {{}} state app state
   * @param {{}} componentProps optional object to pass to the component
   */
  show(state, componentProps) {
    update(this.parent, this.component(this.onShow(state, componentProps)));
    this.postShow(state, componentProps);
  }

  /**
   *
   * @param {{}} state
   */
  hide(state) {
    this.onHide(state);
  }
}
