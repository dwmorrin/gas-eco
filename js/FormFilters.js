import env from "./env";
import { contains } from "./Inventory";

export default {
  isBooked: (form) => form.bookingId,
  isNotBooked: (form) => !form.bookingId,
  isTape: (form) => form.tape,
  byStudentName: (students) => (form) => {
    const studentQuery = students.toLowerCase().split(",");
    return studentQuery.every((nameLookingFor) => {
      nameLookingFor = nameLookingFor.toLowerCase().replace(/\s/g, "");
      return form.students.find((student) => {
        const name = student.name.toLowerCase().replace(/\s/g, "");
        return name.includes(nameLookingFor);
      });
    });
  },
  byMatchAllItemID: (items) => (form) => {
    return items.split(",").every((item) => contains(form.items, item));
  },
  byMatchAnyItemID: (items) => (form) => {
    return items.split(",").some((item) => contains(form.items, item));
  },
  byMissingItem: (form) => {
    return form.items.some((item) => item.missing);
  },
  byStudentLeft: (form) => {
    return form.students.some((student) => student.left);
  },
  byHasManual: (form) => {
    for (let note of form.notes) {
      try {
        let changes = JSON.parse(note.body);
        for (let change of changes) {
          if (change.name == "manual") {
            return true;
          }
        }
      } catch (e) {
        // not changes, ignore
      }
    }
    return false;
  },
  byHasNotes: (form) => {
    for (let note of form.notes) {
      try {
        // Unintuitive use of try/catch:
        JSON.parse(note.body); // (success == change log )
      } catch (e) {
        // (  error == global note)
        return true;
      }
    }
    return false;
  },
  byLateStudents: (form) => {
    const inGracePeriod = 15, // minutes
      outGracePeriod = 10,
      start = new Date(form.startTime),
      end = new Date(form.endTime);
    start.setMinutes(start.getMinutes() + inGracePeriod);
    end.setMinutes(end.getMinutes() + outGracePeriod);

    const checkedInOnTime = (student) =>
      !student.timeSignedInByClient ||
      new Date(student.timeSignedInByClient).getTime() <= start.getTime();

    const studentIncompleteHTML = "DID NOT CHECK OUT";
    const checkedOutLate = (student) =>
      (student.timeSignedInByClient &&
        (!student.timeSignedOutByClient ||
          student.timeSignedOutByClient === studentIncompleteHTML)) ||
      (student.timeSignedOutByClient &&
        student.timeSignedOutByClient !== studentIncompleteHTML &&
        new Date(student.timeSignedOutByClient).getTime() > end.getTime());

    return (
      !form.students.some(checkedInOnTime) || form.students.some(checkedOutLate)
    );
  },
  byNoShow: (form) =>
    form.students.every(({ timeSignedInByClient }) => !timeSignedInByClient),
  byTimeRange: (start, end) => {
    const startTime = new Date(start + "T00:00:00").getTime(),
      endTime = new Date(end + "T23:59:59").getTime();
    return (form) => {
      const t = new Date(form.startTime).getTime();
      return t >= startTime && t <= endTime;
    };
  },
  byLocation: (location) => (form) => {
    if (location === "All") return true;
    if (location !== "Other") {
      if (location !== form.location) {
        return false;
      }
    } else {
      if (env.locations.has(form.location)) {
        return false;
      }
    }
    return true;
  },
};
