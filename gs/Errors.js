/* exported
ErrorFormCollision_
ErrorFormDataInvalid_
ErrorFormInvalid_
*/

function ErrorFormCollision_(saved, submitted) {
  this.saved = saved;
  this.submitted = submitted;
}

function ErrorFormDataInvalid_(data) {
  this.data = data;
}

function ErrorFormInvalid_(message) {
  this.message = message;
}
