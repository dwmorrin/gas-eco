/* exported Utility */
var Utility = (function () {
  return {
    tryJsonParse,
  };

  function tryJsonParse(string) {
    try {
      return JSON.parse(string);
    } catch (error) {
      return null;
    }
  }
})();
