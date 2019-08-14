/* global defaults */
/* exported Student_ */
function Student_(studentData) {
  this.id = studentData[this.dataIndex.ID] || ""; // {string} ID barcode or RFID
  this.checkIn = null;  // {string} formatted date
  this.checkOut = null; // {string} formatted date
  this.contact = studentData[this.dataIndex.CONTACT] || ""; // {string} phone number
  this.name = studentData[this.dataIndex.NAME] || ""; // {string}
  this.netId = studentData[this.dataIndex.NETID] || ""; // {string}
  this.signatureOnFile = Boolean(studentData[this.dataIndex.SIGNATURE]); // {bool}
  this.left = false;    // {bool} true if student left without checking out
}

Student_.prototype.dataIndex = JSON.parse(
  PropertiesService.getScriptProperties()
    .getProperty(defaults.usersSheet.index.key)
);
