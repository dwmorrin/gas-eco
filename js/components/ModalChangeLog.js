  /* global DateUtils HTML Utility */
  /* exported ModalChangeLog */
  function ModalChangeLog({ form }) {
    const { getFormattedDateTime } = DateUtils;
    const { cell, modal, row, table } = HTML;
    const { tryJsonParse, uncamelCase } = Utility;

    const changes = [
      ...form.notes.reduce((areChanges, note) => {
        const change = tryJsonParse(note.body);
        if (!Array.isArray(change)) return areChanges;
        change.forEach((entry) => {
          entry.author = note.author;
          if (!entry.timestamp) entry.timestamp = note.timestamp;
        });
        return [...areChanges, ...change];
      }, []),
    ];

    modal({
      children: [
        table(row(...["Time", "User", "Field", "Value"].map(cell))),
        ...changes.map(({ timestamp, author, name, value }) =>
          row(
            cell(getFormattedDateTime(new Date(timestamp))),
            cell(author),
            cell(uncamelCase(name)),
            cell(value)
          )
        ),
      ],
    });
  }
