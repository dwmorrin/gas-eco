import {
  cell,
  createElement,
  modal,
  heading1,
  paragraph,
  table,
} from "../HTML";
import { sort } from "../Utility";
import Item from "../Item";

export default function ModalQuery({
  value,
  inventory,
  roster,
  onOmniboxSubmit,
}) {
  const queryResults = searchResources({ value, inventory, roster });

  return queryResults.length > 0
    ? modal({
        onClick: ({ event, cleanup }) => {
          if (event.target.tagName.toLowerCase() === "td") {
            cleanup();
          }
        },
        children: [
          heading1("Search results"),
          paragraph("Are you looking for one of these?"),
          table(
            ...queryResults.reduce((rows, { value }) => {
              const id = value.netId || value.id || value.barcode;
              if (!id) return rows;
              return [
                ...rows,
                createElement("tr", {
                  class: "searchResults",
                  children: [cell(value.name || value.description), cell(id)],
                  onClick: () => {
                    onOmniboxSubmit(id);
                  },
                }),
              ];
            }, [])
          ),
        ],
      })
    : modal({
        child: paragraph(
          [
            `"${value}" not found.`,
            'You can type in item IDs like "NEU-1", ',
            'or names like "John Smith".',
          ].join(" ")
        ),
      });

  // QUERY FUNCTIONS

  function clean(s) {
    return s.trim().replace(/['-]/g, "").toLowerCase();
  }

  function searchResources({ value, inventory, roster }) {
    return query(
      clean(value),
      (obj) => {
        if (obj instanceof Item) {
          const keys = [];
          if (typeof obj.description === "string" && obj.description) {
            keys.push(clean(obj.description));
          }
          if (typeof obj.id === "string" && obj.id) {
            keys.push(clean(obj.id));
          }
          return keys;
        } else if (typeof obj.name === "string" && obj.name)
          return [clean(obj.name)];
        else {
          return [];
        }
      },
      inventory,
      roster
    ).filter((result) => result.weight < 4);
  }

  function partiallyIncludes(terms, keys) {
    for (const term of terms) {
      for (let i = 3; i <= term.length; ++i) {
        for (const key of keys) {
          if (key.includes(term.slice(0, i))) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function workBackwards(expression, keys, score) {
    let minWeight = score.BAD;
    for (
      let str = expression;
      str.length > 2;
      str = str.slice(0, str.length - 1)
    ) {
      for (const key of keys) {
        if (key.includes(str)) {
          if (key === str || key.startsWith(str)) {
            const weight = score.BEST + expression.length - str.length;
            minWeight = weight < minWeight ? weight : minWeight;
            str = "";
            break;
          }
        }
      }
    }
    return minWeight;
  }

  function matchTerms(terms, keys, score) {
    const termScores = [];
    for (let i = 0; i < terms.length; ++i) {
      for (
        let str = terms[i];
        str.length > 2;
        str = str.slice(0, str.length - 1)
      ) {
        for (const key of keys) {
          if (key.includes(str)) {
            termScores.push(score.GOOD + terms[i].length - str.length);
            str = "";
            break;
          }
        }
      }
      if (termScores.length === i) {
        // implies we didn't push a good score
        termScores.push(score.BAD);
      }
    }
    return termScores;
  }
  /**
   * query searches through the supplied arrays inspected keys, as found with
   *   the supplied key making function, and returns a weighted result array.
   * The preliminary search filters the arrays for anything that
   *   seems to include the query expression.  As a simple misspelling aid,
   *   the expression is tokenized and matching starts from truncated strings
   *   and grows until a match might be found.
   * The second search does the opposite: the full tokens are examined and
   *   reduced if needed.  Each reduction (which could indicate a misspelling)
   *   causes an increase in the weight.
   *   The best results have a low weight, the worst results have a high weight.
   * @param {string} q - query expression
   * @param {function} keyMaker - ({}) => string[]
   * @param {{}[]} arrays - arrays to query
   * @returns {{value: {}, weight: number}[]}
   */
  function query(q, keyMaker, ...arrays) {
    const score = { BEST: 0, GOOD: 1, BAD: 10 };
    const expression = q.trim().toLowerCase();
    const terms = expression.split(/[\s\W]+/).filter((s) => s.length > 2);

    return sort(
      arrays
        .reduce((reduced, arr) => reduced.concat(arr), [])
        .filter((obj) => partiallyIncludes(terms, keyMaker(obj)))
        .map((value) => {
          const keys = keyMaker(value);
          const minWeight = workBackwards(expression, keys, score);
          const termScores = matchTerms(terms, keys, score);
          const average =
            termScores.reduce((sum, val) => sum + val) / termScores.length;
          return { value, weight: average < minWeight ? average : minWeight };
        }),
      (a, b) => a.weight - b.weight
    );
  }
}
