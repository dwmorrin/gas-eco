import { button } from "../HTML";
import { getFormattedDateTime } from "../DateUtils";
import Form from "../Form";
import Item from "../Item";

export default function CheckOutButton({ form, item, onChange }) {
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
