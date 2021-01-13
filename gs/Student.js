/* exported Student */
class Student {
  constructor(studentData) {
    const dataIndex = {
      ID: 0,
      NAME: 1,
      NETID: 2,
      CONTACT: 3,
      SIGNATURE: 4,
    };
    this.id = studentData[dataIndex.ID] || ""; // {string} ID barcode or RFID
    this.checkIn = ""; // {string} formatted date
    this.checkOut = ""; // {string} formatted date
    this.contact = studentData[dataIndex.CONTACT] || ""; // {string} phone number
    this.name = studentData[dataIndex.NAME] || ""; // {string}
    this.netId = studentData[dataIndex.NETID] || ""; // {string}
    this.signatureOnFile = Boolean(studentData[dataIndex.SIGNATURE]); // {bool}
    this.left = false; // {bool} true if student left without checking out
  }
}
