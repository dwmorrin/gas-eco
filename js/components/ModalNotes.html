<script>
  /* global Form HTML */
  /* exported ModalNotes */
  function ModalNotes({ form, onChange, userName }) {
    const { createElement, heading1, modal, paragraph } = HTML;
    const input = createElement("textarea");
    modal({
      children: [heading1("New note"), paragraph("Enter a note"), input],
      okText: "Save note",
      onOk: () =>
        input.value &&
        onChange({
          form: new Form({
            ...form,
            notes: [
              ...form.notes,
              {
                timestamp: Date.now(),
                author: userName,
                body: input.value,
              },
            ],
          }),
          change: {
            target: {
              name: "notes",
              value:
                input.value.length > 10
                  ? input.value.slice(0, 10) + "..."
                  : input.value,
            },
          },
        }),
    });
    input.focus();
  }
</script>
