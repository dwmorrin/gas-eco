function addOneHour(date) {
  const result = new Date(date);
  result.setHours(date.getHours() + 1);
  return result;
}

function copyTime(date) {
  const result = new Date();
  result.setHours(date.getHours());
  result.setMinutes(date.getMinutes());
  return result;
}

/**
 * @param {Date} date
 * @returns {String} 2020-31-12
 */
function formatDashedDate(date) {
  return (
    date.getFullYear() +
    "-" +
    zeropad(date.getMonth() + 1) +
    "-" +
    zeropad(date.getDate())
  );
}

/**
 * @param {Date} date
 * @param {Boolean} roundTheMinutes
 * @returns {String} 12/31/2020 12:59 PM
 */
function getFormattedDateTime(date, roundTheMinutes = false) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // zero indexed
  const day = date.getDate();
  const minutes = roundTheMinutes
    ? roundMinutes(date.getMinutes())
    : date.getMinutes();
  let hour = date.getHours();
  const ampm = hour > 11 ? "PM" : "AM";

  if (hour > 11) hour %= 12;
  if (hour === 0) hour = 12;
  return `${zeropad(month)}/${zeropad(day)}/${year} ${zeropad(hour)}:${zeropad(
    minutes
  )} ${ampm}`;
}

/**
 * @param {number} minutes
 * @returns {number} n minutes in milliseconds
 */
function minutes(n) {
  return n * 60e3;
}

function roundMinutes(minutes) {
  const minute = minutes % 10;
  return minute < 5
    ? // roll back to :00
      minutes - minute
    : // roll back to :05
      minutes - (minute - 5);
}

function zeropad(n) {
  return String(n).padStart(2, "0");
}

export {
  addOneHour,
  copyTime,
  formatDashedDate,
  getFormattedDateTime,
  minutes,
};
