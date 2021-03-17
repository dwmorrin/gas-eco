// optional: rules: {equipmentAllowedByLocation: {"Room A": ["barcode1", "barcode2"]}}
// This rule would warn users if they check out anything other than barcode 1 and 2 to Room A
export default (function () {
  return {
    locations: new Set(["Room A", "Room B"]), // populates the location select
    needsSignatureMessage: "prompt for new signature",
    notLoadingMessage:
      "a friendly message users see when the app hangs on the loading page",
  };
})();
