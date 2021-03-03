export { getFormattedDateTime };

/**
 * Utility to get 'mm/dd/yyyy hh:mm am' format
 * @param {Date} date
 * @return {string}
 */
function getFormattedDateTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // zero indexed
  const day = date.getDate();
  const minutes = date.getMinutes();
  let hour = date.getHours();
  const ampm = hour > 11 ? "PM" : "AM";

  if (hour > 11) hour %= 12;
  if (hour === 0) hour = 12;
  return `${zeropad(month)}/${zeropad(day)}/${year} ${zeropad(hour)}:${zeropad(
    minutes
  )} ${ampm}`;
}

/** Helper function for handling date strings */
function zeropad(x) {
  return String(x).padStart(2, "0");
}
