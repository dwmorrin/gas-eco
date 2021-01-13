<script>
  /* global DateUtils Form HTML Item */
  /* exported CheckOutButton */
  function CheckOutButton({ form, item, onChange }) {
    const { getFormattedDateTime } = DateUtils;
    const { button } = HTML;
    return button("Check Out", {
      class: "action",
      onClick: () =>
        onChange({
          form: new Form({
            ...form,
            items: form.items.map((i) =>
              i.reserved && Item.similar(i, item)
                ? new Item({
                    ...item,
                    timeCheckedOutByClient: getFormattedDateTime(new Date()),
                  })
                : i
            ),
          }),
          change: {
            target: {
              name: "items",
              value: item.description + " check-out",
            },
          },
        }),
    });
  }
</script>
