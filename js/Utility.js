  /* exported Utility */
  const Utility = (function () {
    const sequentialGenerator = (function* () {
      let n = 0;
      while (true) yield ++n;
    })();

    return {
      applyTo,
      compareDateStrings,
      compareKey,
      compareStrings,
      copyToClipboard,
      digestMessage,
      getSequentialNumber,
      groupBy,
      hexString,
      identity,
      is,
      last,
      nullIf,
      pick,
      range,
      remove,
      replace,
      reverse,
      sort,
      tryJsonParse,
      uncamelCase,
    };

    function applyTo(a) {
      return (fn) => fn(a);
    }

    function compareKey(key, predicate) {
      return (a, b) => predicate(a[key], b[key]);
    }

    function compareDateStrings(a, b) {
      return new Date(a) - new Date(b);
    }

    function compareStrings(a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    }

    function copyToClipboard(data) {
      const textArea = document.createElement("textarea");
      // ensures that copying the items will not cause the screen to scroll down
      textArea.setAttribute("readonly", true);
      textArea.value = data;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy"); //! execCommand is deprecated, migrate to ClipboardAPI
      // removes the text area after copying so that it is not seen
      document.body.removeChild(textArea);
    }

    function digestMessage(message) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      return window.crypto.subtle.digest("SHA-1", data);
    }

    // resets each time app restarts, just for temporary sequencing
    function getSequentialNumber() {
      return sequentialGenerator.next().value;
    }

    function groupBy(predicate, keyMaker = JSON.stringify) {
      return (array) => {
        return Object.values(
          array.reduce((groups, el) => {
            if (!predicate(el)) return groups;
            const key = keyMaker(el);
            if (key in groups)
              return { ...groups, [key]: [...groups[key], el] };
            return { ...groups, [key]: [el] };
          }, {})
        );
      };
    }

    function hexString(buffer) {
      const byteArray = new Uint8Array(buffer);
      const hexCodes = [...byteArray].map((value) => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, "0");
        return paddedHexCode;
      });
      return hexCodes.join("");
    }

    function identity(a) {
      return a;
    }

    function is(x) {
      return (y) => y === x;
    }

    function last(array) {
      return array[array.length - 1];
    }

    function nullIf(condition, expression) {
      return condition ? null : expression;
    }

    function pick(...keys) {
      return (obj) => {
        const copy = {};
        for (const key of keys) {
          copy[key] = obj[key];
        }
        return copy;
      };
    }

    function range(length, start = 0, step = 1) {
      return Array.from({ length }).map((_, i) => i * step + start);
    }

    function remove(array, predicate) {
      const copy = array.slice();
      const index = copy.findIndex(predicate);
      if (index < 0) return copy;
      copy.splice(index, 1);
      return copy;
    }

    function replace(array, predicate, newValue) {
      return array.map((currentValue) =>
        predicate(currentValue) ? newValue : currentValue
      );
    }

    function reverse(array) {
      const copy = array.slice();
      copy.reverse();
      return copy;
    }

    function sort(array, fn) {
      const copy = array.slice();
      copy.sort(fn);
      return copy;
    }

    function tryJsonParse(string) {
      try {
        return JSON.parse(string);
      } catch (error) {
        return null;
      }
    }

    function uncamelCase(string) {
      return string
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
    }
  })();
