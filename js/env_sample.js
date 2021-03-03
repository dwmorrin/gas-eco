export default (function () {
  return {
    locations: new Set(["Room A", "Room B"]), // populates the location select
    needsSignatureMessage: "prompt for new signature",
    notLoadingMessage:
      "a friendly message users see when the app hangs on the loading page",
  };
})();
