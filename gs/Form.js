/* global ErrorFormDataInvalid ErrorFormInvalid DateUtils */
/* exported Form */
class Form {
  constructor(form) {
    const dataIndex = {
      ID: 0,
      START_TIME: 1,
      END_TIME: 2,
      LOCATION: 3,
      BOOKING_ID: 4,
      BOOKED_STUDENTS: 5,
      CONTACT: 6,
      PROJECT: 7,
      TAPE: 8,
      OVERNIGHT: 9,
      STUDENTS: 10,
      ITEMS: 11,
      NOTES: 12,
    };
    if (Array.isArray(form)) {
      try {
        this.bookedStudents = form[dataIndex.BOOKED_STUDENTS] || "";
        this.bookingId = form[dataIndex.BOOKING_ID] || "";
        this.contact = form[dataIndex.CONTACT] || "";
        this.endTime =
          DateUtils.getFormattedDateTime(form[dataIndex.END_TIME]) || "";
        this.id = form[dataIndex.ID] || "";
        this.location = form[dataIndex.LOCATION] || "";
        this.project = form[dataIndex.PROJECT] || "";
        this.overnight = form[dataIndex.OVERNIGHT] || false;
        this.startTime =
          DateUtils.getFormattedDateTime(form[dataIndex.START_TIME]) || "";
        this.tape = form[dataIndex.TAPE] || false;
        this.hash = "";

        // Dynamic properties
        this.items = JSON.parse(form[dataIndex.ITEMS]);
        this.notes = JSON.parse(form[dataIndex.NOTES]) || []; // []Note
        this.students = JSON.parse(form[dataIndex.STUDENTS]) || []; // []Student
      } catch (error) {
        throw new ErrorFormDataInvalid(form);
      }
    } else {
      // Static properties
      this.bookedStudents = form.bookedStudents || "";
      this.bookingId = form.bookingId || "";
      this.contact = form.contact || "";
      this.endTime = form.endTime || "";
      this.id = form.id || "";
      this.location = form.location || "";
      this.project = form.project || "";
      this.overnight = form.overnight || false;
      this.startTime = form.startTime || "";
      this.tape = form.tape || false;
      this.hash = form.hash || "";

      // Dynamic properties
      this.items = form.items || [];
      this.notes = form.notes || [];
      this.students = form.students || [];
    }
  }

  createId() {
    this.id = "" + Date.now();
    return this.id;
  }

  setHash(hash) {
    if (hash) {
      this.hash = hash;
    } else {
      this.hash = "";
      this.hash = Utilities.base64EncodeWebSafe(
        Utilities.computeDigest(
          Utilities.DigestAlgorithm.MD2,
          JSON.stringify(this)
        )
      );
    }
    return this;
  }

  toArray() {
    return [
      this.id,
      this.startTime,
      this.endTime,
      this.location,
      this.bookingId,
      this.bookedStudents,
      this.contact,
      this.project,
      this.tape,
      this.overnight,
      JSON.stringify(this.students),
      JSON.stringify(this.items),
      JSON.stringify(this.notes),
    ];
  }

  isAllGearReturned() {
    return this.items.every(
      ({ checkOut, checkIn, missing }) => !checkOut || checkIn || missing
    );
  }

  hasActiveStudent() {
    return (
      this.students.reduce(
        (count, { checkIn, checkOut, left }) =>
          checkIn && !(checkOut || left) ? count + 1 : count,
        0
      ) > 1
    );
  }

  isNoShow() {
    if (!this.id) return false;
    const gracePeriod = 30,
      start = new Date(this.startTime),
      now = Date.now();

    start.setMinutes(start.getMinutes() + gracePeriod);

    return (
      now > start.getTime() && !this.students.some(({ checkIn }) => checkIn)
    );
  }

  isReadyToClose() {
    if (this.hasActiveStudent() || !this.isAllGearReturned()) {
      return false;
    }
    const checkedIn = (student) => student.checkIn;
    const checkedOutOrLeft = ({ checkIn, checkOut, left }) =>
      !checkIn || checkOut || left;
    return (
      this.students.some(checkedIn) && this.students.every(checkedOutOrLeft)
    );
  }

  validate() {
    if (this.items) {
      // TODO validate with the actual inventory
      this.items.forEach(function (item) {
        const requestingCheckout =
          item.checkOut && !item.checkIn && !item.checkedOut;
        if (requestingCheckout) {
          item.checkedOut = true;
        }
        const requestingCheckIn = item.checkIn && item.checkedOut;
        if (requestingCheckIn) {
          item.checkedOut = false;
        }
      });
    }
    [
      { label: "start time", value: this.startTime },
      { label: "end time", value: this.endTime },
      { label: "location", value: this.location },
      { label: "students", value: this.students },
    ].every(function (field) {
      if (field.value.length < 1) {
        throw new ErrorFormInvalid(
          "Invalid " + field.label + ": " + field.value
        );
      }
      return true;
    });
  }
}
