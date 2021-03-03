<script>
  /* global env HTML Utility */
  /* exported LoadingPage */
  function LoadingPage({
    rosterStatus,
    inventoryStatus,
    openFormsStatus,
    timedOut,
  }) {
    const { createElement, page, paragraph, spinner } = HTML;
    const { nullIf } = Utility;

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
</script>
