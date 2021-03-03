  /* global DateUtils Form HTML Item ModalQuantityChange Utility */
  /* exported QuantityButtons */
  function QuantityButtons({ form, item, disabled, onChange, quantity }) {
    const { getFormattedDateTime } = DateUtils;
    const { button, createElement } = HTML;
    const { range, remove } = Utility;
    return disabled || !item.stagedForOut || item.serialized
      ? // just print the quantity
        document.createTextNode(quantity)
      : // give the user [+][1][-] buttons to adjust the quantity
        createElement("span", {
          children: [
            button("+", {
              class: "quantity",
              onClick: () => {
                onChange({
                  form: new Form({
                    ...form,
                    items: [
                      ...form.items,
                      new Item({
                        ...item,
                        timeCheckedOutByClient: getFormattedDateTime(
                          new Date()
                        ),
                      }),
                    ],
                  }),
                  change: {
                    target: {
                      name: "items",
                      value: `${item.description} quantity ${quantity} to ${
                        quantity + 1
                      }`,
                    },
                  },
                });
              },
            }),
            button(String(quantity), {
              class: "quantity",
              onClick: () =>
                ModalQuantityChange({
                  item,
                  quantity,
                  onOk: (newQuantity) => {
                    onChange({
                      form: new Form({
                        ...form,
                        items: [
                          ...form.items.filter(
                            (i) => !i.stagedForOut || !Item.similar(i, item)
                          ),
                          ...range(newQuantity).map(
                            () =>
                              new Item({
                                ...item,
                                timeCheckedOutByClient: getFormattedDateTime(
                                  new Date()
                                ),
                              })
                          ),
                        ],
                      }),
                      change: {
                        target: {
                          name: "items",
                          value: `${item.description} qty to ${newQuantity}`,
                        },
                      },
                    });
                  },
                }),
            }),
            button("-", {
              class: "quantity",
              onClick: () => {
                onChange({
                  form: new Form({
                    ...form,
                    items: remove(
                      form.items,
                      (i) => Item.similar(i, item) && i.stagedForOut
                    ),
                  }),
                  change: {
                    target: {
                      name: "items",
                      value: `${item.description} quantity ${quantity} to ${
                        quantity - 1
                      }`,
                    },
                  },
                });
              },
            }),
          ],
        });
  }
