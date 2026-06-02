// Load editor support when in Universal Editor
if (/\.(stage-ue|ue)\.da\.live$/.test(window.location.hostname) || window.aue) {
  // eslint-disable-next-line import/no-cycle
  import('./editor-support.js');
}
