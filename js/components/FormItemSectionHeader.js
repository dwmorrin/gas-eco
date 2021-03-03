<script>
  /* global HTML */
  /* exported FormItemSectionHeader */
  function FormItemSectionHeader(textContent) {
    const { cell, row } = HTML;

    return row(
      cell({
        class: "itemsSectionHeader",
        textContent,
        colspan: 5,
      })
    );
  }
</script>
