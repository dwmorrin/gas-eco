<script>
  "use strict";
  /* global DateUtils HTML Utility */
  /* exported DateTimeInput */
  function DateTimeInput({ name, value, onChange }) {
    const { createElement, select, option } = HTML;
    const { getFormattedDateTime } = DateUtils;
    const [month, day, year, hour, minutes, ampm] = (
      value || getFormattedDateTime(new Date(), true)
    ).split(/[/ :]/);
    const inputs = [
      createElement("input", {
        type: "date",
        name: `${name}Date`,
        autocomplete: "off",
        placeholder: "mm/dd/yyyy",
        value: `${year}-${month}-${day}`,
      }),
      select({
        name: `${name}Hour`,
        children: Utility.range(12, 1).map((n) => option(n)),
        value: Number(hour), // to remove zero pad
      }),
      document.createTextNode(":"),
      select({
        name: `${name}Minute`,
        children: Utility.range(12, 0, 5).map((n) =>
          option(String(n).padStart(2, "0"), n)
        ),
        value: Number(minutes), // to remove zero pad
      }),
      select({
        name: `${name}AMPM`,
        children: ["AM", "PM"].map((text) => option(text)),
        value: ampm.toUpperCase(),
      }),
    ];
    inputs.forEach((input) =>
      input.addEventListener("change", (event) => {
        onChange({
          event,
          name,
          values: {
            date: inputs[0].value,
            hour: inputs[1].value,
            minutes: inputs[3].value,
            ampm: inputs[4].value,
          },
        });
      })
    );
    return inputs;
  }
</script>
