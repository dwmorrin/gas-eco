export { ErrorFormCollision, ErrorFormInvalid, ErrorFormDataInvalid };
class ErrorFormCollision {
  constructor(saved, submitted) {
    this.saved = saved;
    this.submitted = submitted;
  }
}

class ErrorFormDataInvalid {
  constructor(data) {
    this.data = data;
  }
}

class ErrorFormInvalid {
  constructor(message) {
    this.message = message;
  }
}
