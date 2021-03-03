import { option, select } from "../HTML";
import { nullIf } from "../Utility";
import env from "../env";

export default function LocationSelect({ form, onChange }) {
  return select({
    name: "location",
    value: form.location,
    onChange,
    children: [
      option("please select", ""),
      ...Array.from(env.locations).map((location) => option(location)),
      nullIf(
        !form.location || env.locations.has(form.location),
        option(form.location)
      ),
      option("Other"),
    ],
  });
}
