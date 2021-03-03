<script>
  /* exported Inventory */
  /** Utilities for Item[], all params named `items` are Item[] */
  const Inventory = (function () {
    return {
      contains,
      getByBarcode,
      getById,
    };
    function contains(items, query) {
      query = query.replace(/\s/g, "").replace(/-0+/, "-");
      return items.find((item) => {
        const id = item.id.replace(/\s/g, "").replace(/-0+/, "-");
        return query === id || item.description.toUpperCase().includes(query);
      });
    }
    function getByBarcode(items, barcode) {
      return items.find((item) => {
        if (!item.barcode) {
          return false;
        }
        return item.barcode.toLowerCase() == barcode;
      });
    }
    function getById(items, id) {
      id = id.toLowerCase().replace(/-0+/, "-");
      return items.find((item) => {
        if (!item.id) {
          return false;
        }
        return item.id.toLowerCase().replace(/-0+/, "-") === id;
      });
    }
  })();
</script>
