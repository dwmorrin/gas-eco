/* exported Student_ */
function Student_(id) {
  this.id = id;         // string corresponding to ID barcode or RFID
  this.checkIn = null;  // string formatted date
  this.checkOut = null; // string formatted date
  this.contact;         // string phone number
  this.name;            // string
  this.netId;           // string
  this.signatureOnFile; // boolean
  
  this.getCheckIn = function() { return this.checkIn; };
  this.getCheckOut = function() { return this.checkOut; };
  this.getContact = function() { return this.contact; };
  this.getId = function() { return this.id; };
  this.getName = function() { return this.name; };
  this.getNetId = function() { return this.netId; };
  this.isSignatureOnFile = function() { return this.signatureOnFile; };
  
  this.setCheckIn = function(date) { this.checkIn = date; return this; };
  this.setCheckOut = function(date) { this.checkOut = date; return this; };
  this.setContact = function(string) { this.contact = string; return this; };
  this.setName = function(name) { this.name = name; return this; };
  this.setNetId = function(netId) { this.netId = netId; return this; };
  this.setSignatureOnFile = function(bool) { this.signatureOnFile = Boolean(bool); return this; };
}
