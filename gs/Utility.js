export { tryJsonParse };

function tryJsonParse(string) {
  try {
    return JSON.parse(string);
  } catch (error) {
    return null;
  }
}
