/* global Booking_ */
function makeBooking_(start, end, studio, studentIds, gear) {
  return [
    '',
    new Date('2020-09-17 ' + start),
    new Date('2020-09-17 ' + end),
    studio,
    studentIds,
    '',
    '',
    '',
    '',
    '',
    '',
    gear
  ];
}

/* exported testConcatBookings_ */
function testConcatBookings_() {
  var data = [
    makeBooking_('09:00:00', '12:00:00', 'Studio 1', 'dm187,k', 'Mic;MIC-1;1'),
    makeBooking_('12:00:00', '15:00:00', 'Studio 2', 'dm187', 'Mic;MIC-1;1,trombone'),
    makeBooking_('12:00:00', '15:00:00', 'Studio 1', 'dm187,k', 'Mic;MIC-1;1'),
    makeBooking_('15:00:00', '18:00:00', 'Studio 2', 'dm187', 'Mic;MIC-1;1,guitar'),
  ];
  Logger.log(Booking_.concatenateSessions(data));
}