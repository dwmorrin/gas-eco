import { ErrorFormInvalid } from "./Errors";
import env from "./env";
import { getFormattedDateTime } from "./DateUtils";
import Item from "./Item";
import { tryJsonParse } from "./Utility";

export default class Form {
  constructor(form) {
    if (Array.isArray(form)) {
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
      } = env.forms;
      this.bookedStudents = String(form[BOOKED_STUDENTS]);
      this.bookingId = String(form[BOOKING_ID]);
      this.contact = String(form[CONTACT]);
      this.endTime = String(getFormattedDateTime(form[END_TIME]));
      this.hash = "";
      this.id = String(form[ID]);
      this.items = tryJsonParse(form[ITEMS]) || [];
      this.location = String(form[LOCATION]);
      this.notes = tryJsonParse(form[NOTES]) || [];
      this.overnight = Boolean(form[OVERNIGHT]);
      this.project = String(form[PROJECT]);
      this.startTime = String(getFormattedDateTime(form[START_TIME]));
      this.students = tryJsonParse(form[STUDENTS]) || [];
      this.tape = Boolean(form[TAPE]);
    } else {
      this.bookedStudents = form.bookedStudents || "";
      this.bookingId = form.bookingId || "";
      this.contact = form.contact || "";
      this.endTime = form.endTime || "";
      this.hash = form.hash || "";
      this.id = form.id || "";
      this.items = form.items || [];
      this.location = form.location || "";
      this.notes = form.notes || [];
      this.overnight = form.overnight || false;
      this.project = form.project || "";
      this.startTime = form.startTime || "";
      this.students = form.students || [];
      this.tape = form.tape || false;
    }
  }

  // getters (computed properties)

  get allGearReturned() {
    return this.items.every(
      ({ timeCheckedInByServer, timeCheckedOutByServer, missing }) =>
        !timeCheckedOutByServer || timeCheckedInByServer || missing
    );
  }

  get hasActiveStudent() {
    return (
      this.students.reduce(
        (count, { timeSignedInByClient, timeSignedOutByClient, left }) =>
          timeSignedInByClient && !(timeSignedOutByClient || left)
            ? count + 1
            : count,
        0
      ) > 1
    );
  }

  get isNoShow() {
    if (!this.id) return false;
    const gracePeriod = 30,
      start = new Date(this.startTime),
      now = Date.now();

    start.setMinutes(start.getMinutes() + gracePeriod);

    return (
      now > start.getTime() &&
      !this.students.some(({ timeSignedInByClient }) => timeSignedInByClient)
    );
  }

  get isReadyToClose() {
    if (this.hasActiveStudent || !this.allGearReturned) {
      return false;
    }
    const checkedIn = (student) => student.timeSignedInByClient;
    const checkedOutOrLeft = ({
      timeSignedInByClient,
      timeSignedOutByClient,
      left,
    }) => !timeSignedInByClient || timeSignedOutByClient || left;
    return (
      this.students.some(checkedIn) && this.students.every(checkedOutOrLeft)
    );
  }

  get validTime() {
    if (!this.startTime || !this.endTime) return false;
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    if (isNaN(start.valueOf()) || isNaN(end.valueOf())) return false;
    return start.valueOf() < end.valueOf();
  }

  // methods

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

  validate() {
    this.students = this.students.map((student) => {
      if (student.timeSignedInByClient && !student.timeSignedInByServer)
        return {
          ...student,
          timeSignedInByServer: getFormattedDateTime(new Date()),
        };
      if (student.timeSignedOutByClient && !student.timeSignedOutByServer)
        return {
          ...student,
          timeSignedOutByServer: getFormattedDateTime(new Date()),
        };
      return student;
    });
    if (this.items) {
      this.items = this.items.map(function (item) {
        if (item.timeCheckedOutByClient && !item.timeCheckedOutByServer) {
          return new Item({
            ...item,
            timeCheckedOutByServer: getFormattedDateTime(new Date()),
          });
        }
        if (item.timeCheckedInByClient && !item.timeCheckedInByServer) {
          return new Item({
            ...item,
            timeCheckedInByServer: getFormattedDateTime(new Date()),
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

  // class helper functions

  static createId() {
    return String(Date.now());
  }
}
