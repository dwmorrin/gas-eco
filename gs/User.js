export { getUserName };

function getUserName() {
  return Session.getActiveUser().getEmail();
}
