import { createElement, page, paragraph, spinner } from "../HTML";
import { nullIf } from "../Utility";
import env from "../env";

export default function LoadingPage({
  rosterStatus,
  inventoryStatus,
  openFormsStatus,
  timedOut,
}) {
  return page({
    name: "loading",
    children: [
      createElement("h2", { textContent: "Loading app data..." }),
      createElement("ul", {
        class: "loadingList",
        children: [
          createElement("li", {
            id: "loadingRoster",
            textContent: rosterStatus,
          }),
          createElement("li", {
            id: "loadingInventory",
            textContent: inventoryStatus,
          }),
          createElement("li", {
            id: "loadingOpenForms",
            textContent: openFormsStatus,
          }),
        ],
      }),
      spinner(),
      nullIf(
        !timedOut,
        paragraph(
          env.notLoadingMessage ||
            "Hmm, the app is taking a long time to load.  Something might be wrong."
        )
      ),
    ],
  });
}
