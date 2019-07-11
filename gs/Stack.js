/* global Form_ */
/* exported Stack_ */
/**
 * Stack_ is a container for Form_ objects,
 *   wraps a private array with custom methods
 */
function Stack_(formsArray) {
  var forms = [];
  if (Array.isArray(formsArray) && formsArray.length > 0 && formsArray[0] instanceof Form_) {
    forms = formsArray;
  }
  this.archive = function() {
    var copy = [];
    forms.forEach(function(form) {
      copy.push(form.archive());
    });
    return copy;
  };
  this.stringify = function() {
    var copy = [];
    forms.forEach(function(form) {
      copy.push(form.archive());
    });
    return JSON.stringify(copy);
  };
  this.getLength = function() {
    return forms.length;
  };
  this.push = function(form) {
    if (! (form instanceof Form_)) {
      throw new Error(form + "is not Form_");
    }
    forms.push(form);
  };
}
