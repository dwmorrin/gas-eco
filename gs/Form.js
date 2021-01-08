/* global ErrorFormInvalid Database DateUtils Item Utility */
/* exported Form */
class Form {
  constructor(form) {
    if (Array.isArray(form)) {
      const { tryJsonParse } = Utility;
      const {
        ID,
        START_TIME,
        END_TIME,
        LOCATION,
        BOOKING_ID,
        BOOKED_STUDENTS,
        CONTACT,
        PROJECT,
        TAPE,
        OVERNIGHT,
        STUDENTS,
        ITEMS,
        NOTES,
      } = Database.index.forms;
      this.bookedStudents = String(form[BOOKED_STUDENTS]);
      this.bookingId = String(form[BOOKING_ID]);
      this.contact = String(form[CONTACT]);
      this.endTime = String(DateUtils.getFormattedDateTime(form[END_TIME]));
      this.id = String(form[ID]);
      this.location = String(form[LOCATION]);
      this.project = String(form[PROJECT]);
      this.overnight = Boolean(form[OVERNIGHT]);
      this.startTime = String(DateUtils.getFormattedDateTime(form[START_TIME]));
      this.tape = Boolean(form[TAPE]);
      this.hash = "";

      // Dynamic properties
      this.items = tryJsonParse(form[ITEMS]) || [];
      this.notes = tryJsonParse(form[NOTES]) || [];
      this.students = tryJsonParse(form[STUDENTS]) || [];
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
      ({ timeCheckedInByServer, timeCheckedOutByServer, missing }) =>
        !timeCheckedOutByServer || timeCheckedInByServer || missing
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
      this.items = this.items.map(function (item) {
        if (item.timeCheckedOutByClient && !item.timeCheckedOutByServer) {
          return new Item({
            ...item,
            timeCheckedOutByServer: DateUtils.getFormattedDateTime(new Date()),
          });
        }
        if (item.timeCheckedInByClient && !item.timeCheckedInByServer) {
          return new Item({
            ...item,
            timeCheckedInByServer: DateUtils.getFormattedDateTime(new Date()),
          });
        }
        return item;
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
