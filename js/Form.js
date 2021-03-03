import Item from "./Item";
import { groupBy } from "./Utility";
import { copyTime, getFormattedDateTime } from "./DateUtils";

export default class Form {
  constructor({
    bookedStudents = "",
    bookingId = null,
    contact = "",
    endTime = "",
    id = null,
    location = "",
    overnight = false,
    project = "",
    startTime = "",
    tape = false,
    hash = "",
    items = [],
    notes = [],
    students = [],
  }) {
    this.items = Object.freeze(items.map((item) => new Item(item)));
    this.bookedStudents = String(bookedStudents);
    this.bookingId = bookingId;
    this.contact = String(contact);
    this.endTime = String(endTime);
    this.id = id;
    this.location = String(location);
    this.project = String(project);
    this.overnight = Boolean(overnight);
    this.startTime = String(startTime);
    this.tape = Boolean(tape);
    this.hash = hash;
    this.notes = Object.freeze(
      notes.map((note) =>
        typeof note === "object" ? Object.freeze({ ...note }) : note
      )
    );
    this.students = Object.freeze(
      students.slice().map((student) => Object.freeze({ ...student }))
    );

    return Object.freeze(this);
  }

  //------ getters (computed properties)

  get hasItemsOut() {
    if (!this.items.length) return false;
    return this.items.every(
      ({ timeCheckedOutByServer, timeCheckedInByClient, missing }) => {
        return timeCheckedOutByServer && !timeCheckedInByClient && !missing;
      }
    );
  }

  get itemsIn() {
    return groupBy(
      (item) => item.isIn,
      (item) => item.key
    )(this.items);
  }

  get itemsOut() {
    return groupBy(
      (item) => item.isOut,
      (item) => item.key
    )(this.items);
  }

  get itemsReserved() {
    return groupBy(
      (item) => item.reserved,
      (item) => item.key
    )(this.items);
  }

  get itemsStagedForIn() {
    return groupBy(
      (item) => item.stagedForIn,
      (item) => item.key
    )(this.items);
  }

  get itemsStagedForOut() {
    return groupBy(
      (item) => item.stagedForOut,
      (item) => item.key
    )(this.items);
  }

  get isAdvanceBooking() {
    return (
      this.students.length &&
      this.students.every(({ timeSignedInByServer }) => !timeSignedInByServer)
    );
  }

  // is this a new, unsaved (in Sheets) form?
  get isBlank() {
    return this.id === null;
  }

  get isNoShow() {
    if (!this.id) return false;
    const gracePeriod = 30, // minutes
      start = new Date(this.startTime),
      now = Date.now();

    start.setMinutes(start.getMinutes() + gracePeriod);

    return (
      now > start.getTime() &&
      !this.students.some(({ timeSignedInByClient }) => timeSignedInByClient)
    );
  }

  get isReadyToClose() {
    // Need at least 1 check-in, and everyone checked-in must be checked-out
    return (
      this.students.some(({ timeSignedInByClient }) => timeSignedInByClient) &&
      this.students.every(
        ({ timeSignedInByClient, timeSignedOutByClient, left }) =>
          !timeSignedInByClient || timeSignedOutByClient || left
      )
    );
  }

  get validTime() {
    if (!this.startTime || !this.endTime) return false;
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    if (isNaN(start.valueOf()) || isNaN(end.valueOf())) return false;
    return start.valueOf() < end.valueOf();
  }

  //------ methods

  duplicate() {
    return new Form({
      ...this.makeAdvanceBooking(),
      id: null,
      startTime: getFormattedDateTime(copyTime(new Date(this.startTime))),
      endTime: getFormattedDateTime(copyTime(new Date(this.endTime))),
    });
  }

  hasStudent(student) {
    return Boolean(this.students.find((s) => s.id == student.id));
  }

  makeAdvanceBooking() {
    return new Form({
      ...this,
      notes: [],
      students: this.students.map((student) => ({
        ...student,
        left: false,
        timeSignedInByClient: "",
        timeSignedInByServer: "",
        timeSignedOutByClient: "",
        timeSignedOutByServer: "",
      })),
      items: this.items.map(
        (item) =>
          new Item({
            ...item,
            missing: false,
            timeCheckedInByClient: "",
            timeCheckedInByServer: "",
            timeCheckedOutByClient: "",
            timeCheckedOutByServer: "",
          })
      ),
    });
  }

  // class helper functions

  // considers both location and start/end times to find overlap
  static overlap(a, b) {
    if (a.id === b.id || a.location !== b.location) return false;
    const intervalA = {
      start: new Date(a.startTime),
      end: new Date(a.endTime),
    };
    const intervalB = {
      start: new Date(b.startTime),
      end: new Date(b.endTime),
    };
    if (intervalA.start.valueOf() === intervalB.start.valueOf()) return true;
    const [earlier, later] =
      intervalA.start.valueOf() < intervalB.start.valueOf()
        ? [intervalA, intervalB]
        : [intervalB, intervalA];
    return later.start.valueOf() < earlier.end.valueOf();
  }
}
