import env from "./env";

export default class Student {
  constructor(studentData) {
    const { ID, NAME, NETID, CONTACT, SIGNATURE } = env.students;
    this.contact = studentData[CONTACT] || ""; // {string} phone number
    this.id = studentData[ID] || ""; // {string} ID barcode or RFID
    this.left = false; // {bool} true if student left without checking out
    this.name = studentData[NAME] || ""; // {string}
    this.netId = studentData[NETID] || ""; // {string}
    this.signatureOnFile = Boolean(studentData[SIGNATURE]); // {bool}
    this.timeSignedInByClient = "";
    this.timeSignedInByServer = "";
    this.timeSignedOutByClient = "";
    this.timeSignedOutByServer = "";
  }
}
