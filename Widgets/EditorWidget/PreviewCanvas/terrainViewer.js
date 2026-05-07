let refs=null;
let canvasBox=null;
let canvas = null;
let ctx =null;
let isActiveView=false;
let dtm = null;
let hotbar =null;

export default {
    handleInput(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta)
    {
        // cameraViewControls(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta);
        managePreviewPan(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta);
    },
    start(_refs, cb, hb) {
        refs=_refs;
        hotbar=hb;
        dtm=refs.dtm;
        pendingPreviewUpdate=true;
        canvasBox=cb;
        selectedTerrainBody=dtm.terrainBodies[0];
    },
    loop() {
        if (pendingPreviewUpdate)
        {
            updatePreview(selectedTerrainBody ? selectedTerrainBody.genData:dtm.terrainBodies[0].genData, curPreviewZoom, curPreviewOffsetX, curPreviewOffsetY, curHeightCutoff); 
            pendingPreviewUpdate=false;
        }
    },
    enable() {
        isActiveView=true;
        canvas = document.createElement("canvas");
        canvas.className="preview-canvas";
        ctx = canvas.getContext("2d");
        canvasBox.appendChild(canvas);
        pendingPreviewUpdate=true;
        this.resize();
    },
    disable()
    {
        if (canvas) {canvas.remove(); canvas=null;}
        isActiveView=false;
    },
    resize() {
        const width = canvasBox.clientWidth;
        const height = canvasBox.clientHeight;

    },
    onPointerDown(e)
    {
        lastPntrX=e.clientX;
        lastPntrY=e.clientY;
		canvasBox.setPointerCapture(e.pointerId);
    },
    onPointerMove(e)
    {
    },
    onPointerUp(e)
    {
        canvasBox.releasePointerCapture(e.pointerId);
    },
    onPointerCancel(e)
    {
		canvasBox.releasePointerCapture(e.pointerId);
    },
	onKeyDown(e) {},
    onKeyUp(e) {},
	getHotbarHTML()
    {
        return "<select id='select-face' onchange='hotbarButtonPress(this)'><option>top</option><option>left</option><option>right</option><option>back</option><option>front</option><option>bottom</option></select>&nbsp; <input type='button' onclick='hotbarButtonPress(this)' value='reset'><select onchange='setPreviewFilter(this)'><option>color</option><option>height-map</option></select>&nbsp;  <span class='preview-height-slider'><input type='range' oninput='onChangeHeightSlider(this)'><span>0</span><span>top</span><span>curVal</span><span>radius</span></span>";
    },postSetHotbar()
    {
        curHeightCutoff = selectedTerrainBody.genData.skyLimit;
        setCurTerrainBody(selectedTerrainBody);
    },hotbarButtonPress(btn)
    {
		if (btn.value=="reset")
		{
			curPreviewOffsetX=0;
			curPreviewOffsetY=0;
			console.log("resetOffset");
			curPreviewZoom=0.6;
			pendingPreviewUpdate = true; 
		}
		else if (btn.id=='select-face')
		{
			switchFace(btn.value);
			console.log(btn.value);
		}
    },
	setCurTerrainBody(tb)
	{
		setCurTerrainBody(tb);
	},
	setFaceFromPlanetView(i)
	{
		let faceStr="left"; if (i==1) {faceStr="right";}
		if (i==2) {faceStr="top";} if (i==3) {faceStr="bottom";}
		if (i==4) {faceStr="front";} if (i==5) {faceStr="back";}
		switchFace(faceStr);
	}
}




 
let curPreviewZoom = 0.6;
let lastPreviewZoom = 1;
let curPreviewOffsetX = 0; let curPreviewOffsetY = 0;
let pendingPreviewUpdate = true;
let isDraggingPreview = false;
let lastPntrX = 0;
let lastPntrY = 0;
let curH=0;
let viewFilterSetting="color";//"height-map"
let curHeightCutoff=0;
let lastHighestSurf;
let curFace = "top";
let upDir=0;
let selectedTerrainBody=null;

window.setPreviewFilter = selEl=>{
	viewFilterSetting=selEl.value;
	pendingPreviewUpdate=true;
}
window.onChangeHeightSlider = sliderEl =>{
	const newVal = parseInt(sliderEl.value);
	if (newVal == curHeightCutoff) {return;}
	curHeightCutoff = newVal;
	// console.log("height cutOff: " + curHeightCutoff);
	pendingPreviewUpdate=true;
	updateHeightSliderControls();
}


function switchFace(newFace)
{
	curFace = newFace;
	if (curFace=="top") {upDir=0;}
	else if (curFace=="bottom") {upDir=1;}
	else if (curFace=="left") {upDir=2;}
	else if (curFace=="right") {upDir=3;}
	else if (curFace=="front") {upDir=4;}
	else if (curFace=="back") {upDir=5;}
	pendingPreviewUpdate=true;
}

function managePreviewPan(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta)
{  
    curPreviewZoom+= (scrollDelta*-0.0001) / curPreviewZoom;
	if (curPreviewZoom < 0.1) { curPreviewZoom = 0.1;}
	if (curPreviewZoom > 5) { curPreviewZoom = 5;}
	if (Math.abs(curPreviewZoom - lastPreviewZoom) > 0.01)
	{
		pendingPreviewUpdate = true;  
		lastPreviewZoom = curPreviewZoom;
	}
	if (!isDraggingPreview) {return;}
	let panSensitivity = 0.1 / curPreviewZoom;
	let curPreviewDragX = pointerX - lastPntrX;
	let curPreviewDragY = pointerY - lastPntrY;
	let dist = 0;
	if (curPreviewDragY != 0 || curPreviewDragX != 0) { dist = Math.hypot(curPreviewDragX, curPreviewDragY); }
	if (dist > 2)
	{
		curPreviewOffsetX-= curPreviewDragX*panSensitivity; curPreviewOffsetY-= curPreviewDragY*panSensitivity; 
		lastPntrX = pointerX; lastPntrY = pointerY;
		pendingPreviewUpdate = true; 
	}
	
}


function updatePreview(bodyGenData, zoom, offsetX, offsetY, heightCutOff=0) {
	if (zoom < 0.1) {zoom = 0.1;}
	let unscaledResolutionW = 100;
	let previewResolution = Math.floor(unscaledResolutionW / zoom);
  const yVal= 0; 
  const size = canvasBox.clientWidth; // assume square
  const aspect = canvasBox.clientHeight / canvasBox.clientWidth;

  // Set REAL canvas resolution (pixel buffer)
  canvas.width = previewResolution;
  canvas.height = Math.floor(previewResolution * aspect);
	offsetX -= Math.floor((unscaledResolutionW*0.5) / zoom); offsetY -= Math.floor((unscaledResolutionW * aspect * 0.5) / zoom);

	offsetX = Math.floor(offsetX); offsetY = Math.floor(offsetY);

  // Scale canvas visually to fit preview box
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.imageRendering = "pixelated";
	canvas.top=0;

  // Disable smoothing so pixels stay sharp
  ctx.imageSmoothingEnabled = false;
	let vFS = 0
	switch (viewFilterSetting) 
	{
		case "color":
			vFS= 0;
			break;
		case "height-map":
			vFS= 1; 
			break
		default:
			console.log("unknown setting");
			vFS= 0;
	}
 
	let highestSurf=-100;
	let rotate=false;
	let flipX=false; let flipY=false;
	if (upDir==0) {flipX=true;  flipY=false;}//up
	if (upDir==1) {flipY=true;}//down
	if (upDir==2) {rotate=true; flipX=false; flipY=true; }//left
	if (upDir==3) {rotate=true; flipX=true; flipY=false;}//right
	if (upDir==4) {flipX=true; flipY=true;}//front
	let blockPosX = 0; let blockPosZ = 0; let blockHeight=0;
  for (let y = 0; y < canvas.height; y+=1) {
        for (let x = 0; x < canvas.width; x+=1) {
			let tx = x + offsetX;let ty = y+ offsetY;
			if (rotate) {let tmp=tx; tx=ty; ty=tmp;}
			if (flipX) {tx = -tx;}
			if (flipY) {ty = -ty;}
      // const isDark = (x + y) % 2 === 0; 
      // ctx.fillStyle = isDark ? blockData[1].color : blockData[2].color;
      // ctx.fillRect(x, y, 1, 1); // 1 pixel per cell
      // console.log(blockType);
      // 
			blockPosX = tx; blockPosZ = ty;
			if (Math.abs(blockPosX) > bodyGenData.radius || Math.abs(blockPosZ) > bodyGenData.radius) {
				ctx.fillStyle = "black";//blockData[0].color; //Air
      	ctx.fillRect(x, y, 1, 1);
				continue;}
			let worldPos = refs.customMaths.unorientCoordinates(upDir, [blockPosX,yVal,blockPosZ]);
			const biomeParams = refs.terrainGen.getBiomeParams(worldPos,
			upDir,
			blockPosX,
			blockPosZ,  
			bodyGenData, true);
			const flooredSurfHeight = Math.floor(biomeParams.surfaceHeight);
			if (flooredSurfHeight > highestSurf) {highestSurf = flooredSurfHeight;}
			if (flooredSurfHeight > heightCutOff) {blockHeight = heightCutOff;}
			else {blockHeight = flooredSurfHeight}
			if (vFS==0) 
			{
				worldPos = refs.customMaths.unorientCoordinates(upDir, [blockPosX,blockHeight,blockPosZ]);
				const blockType = refs.terrainGen.sampleBlock( 
					worldPos,     // { x, y, z } 
					upDir,             // string or enum
					bodyGenData,
					null,     // array dirrotindices
					biomeParams,
					false);
				let color = refs.dtm.blockData[blockType].color;
				if ((Math.floor(blockHeight)) % 2==0) 
				{
					color = `color-mix(in hsl, ${color} 92%, black)`;
				}
				ctx.fillStyle = color;
				
			}
			else if (vFS == 1)
			{
				let heightGrad = ((((Math.floor(blockHeight*2)/2) - bodyGenData.radius) / (30))+0.1) * 100; 
				ctx.fillStyle = `color-mix(in hsl, white ${heightGrad}%, black)`;
			}
			
			ctx.fillRect(x, y, 1, 1); // 1 pixel per cell
    }
  }
  lastHighestSurf = highestSurf;
}


function setCurTerrainBody(newTBody)
{
		if (curHeightCutoff > newTBody.genData.skyLimit) {curHeightCutoff = newTBody.genData.skyLimit;}
		selectedTerrainBody = newTBody;
		updateHeightSliderControls();
}
function updateHeightSliderControls()
{
	const skyLimit=selectedTerrainBody.genData.skyLimit;
	const surfaceHeight = selectedTerrainBody.genData.radius;
	const heightControls = hotbar.querySelector(".preview-height-slider");
		const slider =heightControls.querySelector("input[type=range]");
		slider.max = skyLimit;
		slider.value = curHeightCutoff;
		const sliderHeight= Math.min(300, skyLimit);
		slider.style.height = sliderHeight+ "px";
		const sliderLabels = heightControls.querySelectorAll("span");
		sliderLabels[0].textContent = "0";
		sliderLabels[0].style.bottom = "0";
		sliderLabels[1].textContent = skyLimit;
		sliderLabels[1].style.top = "0";
		sliderLabels[2].style.display = (curHeightCutoff > 10 && curHeightCutoff < skyLimit-15) ? "inline" : "none";
	sliderLabels[2].style.top = (((1-(curHeightCutoff/skyLimit)) * sliderHeight) -10) + "px";
	sliderLabels[2].textContent = "_" + curHeightCutoff;
	sliderLabels[2].style.color="black";
	sliderLabels[2].style.zIndex=4;
	sliderLabels[2].style.fontWeight="bold";
	sliderLabels[3].textContent = "surface";
	sliderLabels[3].style.top = (((1-(surfaceHeight/skyLimit)) * sliderHeight) -10) + "px";
}
