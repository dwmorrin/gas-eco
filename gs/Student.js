/* global env */
/* exported Student */
class Student {
  constructor(studentData) {
    const { ID, NAME, NETID, CONTACT, SIGNATURE } = env.students;
    this.id = studentData[ID] || ""; // {string} ID barcode or RFID
    this.checkIn = ""; // {string} formatted date
    this.checkOut = ""; // {string} formatted date
    this.contact = studentData[CONTACT] || ""; // {string} phone number
    this.name = studentData[NAME] || ""; // {string}
    this.netId = studentData[NETID] || ""; // {string}
    this.signatureOnFile = Boolean(studentData[SIGNATURE]); // {bool}
    this.left = false; // {bool} true if student left without checking out
  }
}
