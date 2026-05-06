import {EditorWidgetApp} from "./Widgets/EditorWidget/editorWidget.js";

const editorWidget = new EditorWidgetApp();

function start()
{
  editorWidget.start();
  loop();
}
function loop()
{
  editorWidget.loop();
  requestAnimationFrame(loop);
}
function resize()
{
  editorWidget.resize();
}

window.addEventListener("resize", resize);

start();



