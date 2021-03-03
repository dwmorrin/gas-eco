  /* global env HTML Utility */
  /* exported LocationSelect */
  function LocationSelect({ form, onChange }) {
    const { option, select } = HTML;
    const { nullIf } = Utility;

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
