import uniNav from "./universeNavigator.js";
import terrainViewer from "./terrainViewer.js";

let refs=null;

let currentViewId=0;
let currentView = null;
let views=[uniNav, terrainViewer];

let isDraggingPreview = false;
let pendingPreviewUpdate = false;

let pointerX=0; let pointerY=0;
let dragXDelta=0;
let dragYDelta=0;
let scndaryDragXDelta=0;
let scndaryDragYDelta=0;
let scrollDelta=0;

const previewBox = document.querySelector(".tl-preview");
const canvasBox = document.createElement("div"); canvasBox.className="preview-canvas-box";
previewBox.appendChild(canvasBox);

const hotbar = document.createElement("div");
hotbar.className="preview-hotbar";
previewBox.appendChild(hotbar);

function start(_refs)
{
    refs=_refs;
    window.terrainViewer = terrainViewer;
    const resizeObserver = new ResizeObserver(() => {
    this.resize();
    });
    resizeObserver.observe(canvasBox);
    setUpPreviewEvents();
    views.forEach(view=>
    {
        if (view){view.start(refs, canvasBox, hotbar);}
    });
    setView(0);
    
    
}
function loop()
{
    if (currentView)
    {
        currentView.handleInput(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta);
        currentView.loop();
    }
    resetInputFrame();
}
function resize()
{
    if (currentView)
    {
        currentView.resize();
    }
}
function setupHotbarHTML()
{
    let hbHTML = "<input type='button' onclick='hotbarButtonPress(this)' value='toggle view'>";
    
    if (currentView) {hbHTML+=currentView.getHotbarHTML();}
    hotbar.innerHTML=hbHTML;
    if (currentView) {currentView.postSetHotbar();}
}
function hotbarButtonPress(btn)
{
    if (currentView) {currentView.hotbarButtonPress(btn);}
    if (btn.value=="toggle view")
    {
        console.log((currentViewId+1)%views.length);
        setView((currentViewId+1)%views.length);
    }
}
export { start, loop,  resize, setupHotbarHTML, hotbarButtonPress as default};

function setUpPreviewEvents()
{
    canvasBox.addEventListener("wheel", (e) => {
        e.preventDefault();
        scrollDelta = e.deltaY;
    });
    canvasBox.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        
        // document.body.style.cursor="none";

        isDraggingPreview = true;
        pointerX = e.clientX;
        pointerY = e.clientY;
        // canvasBox.setPointerCapture(e.pointerId); // keeps tracking even if pointer leaves element
        if (currentView){currentView.onPointerDown(e);};
    });

    canvasBox.addEventListener("pointermove", (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;

    if (isDraggingPreview)
    {
        if (e.buttons===1){dragXDelta = e.movementX;
        dragYDelta = e.movementY;}
        if (e.buttons===4 || e.buttons===2){scndaryDragXDelta = e.movementX;
        scndaryDragYDelta = e.movementY;}
    }
    
    if (currentView){currentView.onPointerMove(e);};
    });

    canvasBox.addEventListener("pointerup", (e) => {
        isDraggingPreview = false;
        // canvasBox.releasePointerCapture(e.pointerId);
        if (currentView){currentView.onPointerUp(e);};
       
        // document.body.style.cursor="auto";
    });

    canvasBox.addEventListener("pointercancel", () => {
        isDraggingPreview = false;
        if (currentView){currentView.onPointerCancel(e);};
        // document.exitPointerLock();
    });
}
function resetInputFrame()
{
    dragXDelta=0;dragYDelta=0;scrollDelta=0;scndaryDragXDelta=0;scndaryDragYDelta=0;
}

window.setCanvasView = v=>
{
    if (v=="terrainView"){setView(1);}
    else if (v=="uniNav"){setView(0);}
}

function setView(newViewId)
{
    canvasBox.innerHTML="";
    if (currentView) {currentView.disable();}
    currentView = views[newViewId];

    currentViewId = newViewId;
    if (currentView) {currentView.enable(); currentView.resize();}
    setupHotbarHTML();
    
}

window.hotbarButtonPress = btn=>{
	hotbarButtonPress(btn);
	
	 
}


window.onTriggerPreviewUpdate = ()=> {
    console.log("preview update");
    pendingPreviewUpdate=true;
}
























