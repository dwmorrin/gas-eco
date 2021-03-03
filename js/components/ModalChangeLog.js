import { getFormattedDateTime } from "../DateUtils";
import { cell, modal, row, table } from "../HTML";
import { tryJsonParse, uncamelCase } from "../Utility";

export default function ModalChangeLog({ form }) {
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
