
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js";

let refs=null;

let isActiveView=false;
let hotbar=null;
let universe = null;
let focusedPoint = null;

let simScale=10;
let starPointScale=0.008;
let cosmicPos = null;
let coordinateText = null;
let shiftKeyDown=false;

export default {
    handleInput(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta)
    {
        cameraViewControls(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta);
      },
    start(_refs, cb, hb) {
      refs=_refs;
        hotbar=hb;
        pendingRerender=true;
        canvasBox=cb;
        universe = refs.uniGen.createUniverse(22123);
        setUpScene();
        
    },
    loop() {
        manageStarCube();
        manageHoverObject();
        if (pendingRerender) {render(); pendingRerender=false;}
    },
    enable() {
        isActiveView=true;
        canvasBox.appendChild(renderer.domElement);
    },
    disable()
    {
      document.exitPointerLock();
      canvasBox.style.cursor="auto";
      isActiveView=false;
    },
    resize() {
        const width = canvasBox.clientWidth;
        const height = canvasBox.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        pendingRerender=true;
    },
    onPointerDown(e)
    {
      canvasBox.requestPointerLock();
      if (e.buttons===1)
      {
        if (hoveredObject)
        {
          if (hoveredObject.isStar) 
          { 
            let rad = (hoveredObject.size /starPointScale) / simScale;
            console.log("radius;" + rad);
            const orbitRadius = (rad*0.001)*10*simScale;
            focusedPoint = {type:"star", size:rad*0.001*simScale, position: hoveredObject.position, orbitRadius:orbitRadius, maxOrbitRadius: orbitRadius*2.5, hasLocked:false}
            hoveredObject=null;
          }
          else
          {
            if (hoveredObject.faceIndex > -1)
            {
              // console.log("openingTerrainBody: ", focusedPoint.terrainBody);
              window.setCanvasView("terrainView");
              window.terrainViewer.setCurTerrainBody(focusedPoint.terrainBody);
              window.terrainViewer.setFaceFromPlanetView(hoveredObject.faceIndex);
              
            }
          }
        }
      }
    },
    onPointerMove(e)
    {
      if (focusedPoint && !focusedPoint.hasLocked) {return;}
        makeRaycast(e);
    },
    onPointerUp(e)
    {
       document.exitPointerLock();
    },
    onPointerCancel(e)
    {
       document.exitPointerLock();
    },
    onKeyDown(e) { if (e.key=="Shift"){shiftKeyDown=true;}},
    onKeyUp(e) {if (e.key=="Shift"){shiftKeyDown=false;}},
    getHotbarHTML(){
      return "<span id='coordinate-text'>123123</span>";
    },
    postSetHotbar() {
      coordinateText = hotbar.querySelector("#coordinate-text");
    },
    hotbarButtonPress(btn)
    {}
}

let pendingRerender=true;
let canvasBox=null;
let hoveredObject = null;
let camPitch = 0;
let camYaw = 0;

const tempQuatC = new THREE.Quaternion();
const upC = new THREE.Vector3();
const rightC = new THREE.Vector3();
const targQuatC= new THREE.Quaternion();
const targQuat= new THREE.Quaternion();


let lerpSpeedMultiplier = 0.1;
function cameraViewControls(pointerX, pointerY, scrollDelta, isDraggingPreview, dragXDelta, dragYDelta, scndaryDragXDelta, scndaryDragYDelta)
{ 
  let shiftSpeedMulti = shiftKeyDown ? 3 : 1;
  let pos = new THREE.Vector3().copy(camera.position);
  let rot = new THREE.Quaternion().copy(camera.quaternion);

  let forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const worldUp = new THREE.Vector3(0, 1, 0);

  let right = new THREE.Vector3();
  right.crossVectors(forward, worldUp).normalize();

  let up = new THREE.Vector3();
  up.crossVectors(right, forward).normalize();
  

 

  if (!focusedPoint)
  {

     // move right/left
    camera.position.addScaledVector(right, -dragXDelta * 0.2 * simScale*shiftSpeedMulti);
    // move up/down
    camera.position.addScaledVector(up, dragYDelta * 0.2 * simScale* shiftSpeedMulti);
    // move forward/backward
    camera.position.addScaledVector(forward, -scrollDelta * 0.2 * simScale * shiftSpeedMulti*shiftSpeedMulti);
    
    
    camYaw += -scndaryDragXDelta * 0.02; 
    camPitch += -scndaryDragYDelta * 0.02;

    // clamp pitch (prevents flipping)
    const maxPitch = Math.PI / 2 - 0.01;
    camPitch = Math.max(-maxPitch, Math.min(maxPitch, camPitch));

    // camera.rotation.order = 'YXZ'; // IMPORTANT
    // camera.rotation.y = camYaw;
    // camera.rotation.x = camPitch;
    // camera.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(camPitch,camYaw,0)), 0.01);
    // camera.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(scndaryDragYDelta * 0.02,-scndaryDragXDelta * 0.02,0)));

    const yawC = new THREE.Quaternion();
    const pitchC = new THREE.Quaternion();

    // camera-local axes
    const cameraMatrix = new THREE.Matrix4().makeRotationFromQuaternion(camera.quaternion);

    right = new THREE.Vector3(1, 0, 0).applyMatrix4(cameraMatrix);
    up = new THREE.Vector3(0, 1, 0).applyMatrix4(cameraMatrix);

    // yaw: around world up OR gravity up (choose one)
    const upC = worldUp.clone().applyQuaternion(camera.quaternion);

    // optional flip (still valid, but less necessary now)
    const yawSign = upC.y < 0 ? -1 : 1;

    // yaw should rotate around *world up* for orbit-style controls
    yawC.setFromAxisAngle(
      worldUp,
      -scndaryDragXDelta * 0.04 * yawSign
    );

    // pitch should rotate around CAMERA RIGHT axis (not world X)
    pitchC.setFromAxisAngle(
      right,
      -scndaryDragYDelta * 0.04
    );

    // apply
    targQuatC.quaternion.multiplyQuaternions(yawC, camera.quaternion);
    targQuatC.quaternion.multiplyQuaternions(pitchC, targQuatC.quaternion);
    camera.quaternion.slerp(targQuatC.quaternion, 0.2);
  }
  else
  {
    let distance = camera.position.distanceTo(focusedPoint.position);
    let distMulti =Math.min(Math.max(0.1,distance/focusedPoint.maxOrbitRadius),1);
    focusedPoint.orbitRadius += scrollDelta*0.06 *simScale * (distMulti*distMulti);
    // if (scrollDelta) {console.log(distMulti);}
    focusedPoint.orbitRadius=Math.max(focusedPoint.orbitRadius, focusedPoint.maxOrbitRadius/10);
    // move right/left
    camera.position.addScaledVector(right, (scndaryDragXDelta+dragXDelta) * -0.01 * focusedPoint.orbitRadius *0.06 *simScale);
    // move up/down
    camera.position.addScaledVector(up, (scndaryDragYDelta+dragYDelta) * 0.01 * focusedPoint.orbitRadius *0.06 *simScale);

    let newOffset =  new THREE.Vector3().subVectors(focusedPoint.position, camera.position);
    let newDistance = newOffset.length();
    if (newDistance != distance)
    {
      camera.position.addScaledVector(newOffset.normalize(), newDistance-distance);
    }

    

    if (distance < focusedPoint.maxOrbitRadius)
    {
      // * (scrollDelta==0?1:0.1)
      
      // let tartLerpSM = scrollDelta == 0? 0.1 : 1;
      // lerpSpeedMultiplier = 1;//Math.abs(lerpSpeedMultiplier-tartLerpSM)*1*((lerpSpeedMultiplier-tartLerpSM)>0?-1:1);

      if (distance < focusedPoint.orbitRadius-0.5)
      {
        // camera.position.lerp(focusedPoint.position, -0.2*lerpSpeedMultiplier);
        // camera.position.addScaledVector(forward, -1 * 0.1 * focusedPoint.orbitRadius *0.06 *simScale);
        camera.position.addScaledVector(forward, -Math.min(focusedPoint.orbitRadius-distance, 0.3 * focusedPoint.orbitRadius *0.06 *simScale)*shiftSpeedMulti);
      }
      else if (distance > focusedPoint.orbitRadius+0.5)
      {
        camera.position.addScaledVector(forward, Math.min(distance - focusedPoint.orbitRadius, 0.3 * focusedPoint.orbitRadius *0.06 *simScale));
        // camera.position.lerp(focusedPoint.position, 0.2*lerpSpeedMultiplier);
      }
      focusedPoint.hasLocked=true;
    }
    else if (focusedPoint.orbitRadius >= focusedPoint.maxOrbitRadius) {focusedPoint= null; if (hoveredObject && !hoveredObject.isStar){hoveredObject=null;}}
    else
    {
      camera.position.addScaledVector(forward, Math.min(distance - focusedPoint.orbitRadius, 1 * focusedPoint.orbitRadius *0.06 *simScale));
    }
    if (focusedPoint)
    {
      const upC = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      m.lookAt(camera.position, focusedPoint.position, up);
      targQuatC.setFromRotationMatrix(m);
      camera.quaternion.slerp(targQuatC, Math.min(Math.max(0.1,focusedPoint.maxOrbitRadius/distance),1));
    }
  }
  

  if (scrollDelta != 0 || dragXDelta != 0 || dragYDelta != 0 || scndaryDragXDelta != 0 || scndaryDragYDelta != 0)
  {
    pendingRerender=true;
  }
  if (pos.x!==camera.position.x || pos.y!==camera.position.y || pos.z!==camera.position.z
    || rot.x!==camera.quaternion.x || rot.y!==camera.quaternion.y || rot.z!==camera.quaternion.z || rot.w!==camera.quaternion.w
  ) {
    UpdateCosmicPos();
    pendingRerender=true;}
}
const m = new THREE.Matrix4();
// const up = new THREE.Vector3(0, 1, 0);

function makeRaycast(mouseEvent)
{
  let noHits=true;
  // console.log("raycasting!");
  const rect = renderer.domElement.getBoundingClientRect();
    let mouse= new THREE.Vector2();
  mouse.x = ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (focusedPoint)
  {
    const intersects = raycaster.intersectObject(starCube);
    const ray = raycaster.ray;
    

    if (intersects.length>0 && intersects[0].face.materialIndex > -1)
    {
      const lateralDistance = ray.distanceToPoint(intersects[0].point);
      noHits=false;
      if (hoveredObject)
      {
        if (intersects[0].face.materialIndex != hoveredObject.faceIndex)
        {pendingRerender=true;}
      }
      hoveredObject = {
        intersect: intersects[0],
        position: focusedPoint.position,
        size: focusedPoint.size,
        isStar: false,
        faceIndex: intersects[0].face.materialIndex
      }
    }
  }
  if (noHits)
  {
    const intersects = raycaster.intersectObject(points);
    const ray = raycaster.ray;

    for (let i = 0; i < intersects.length && noHits; i++) 
    {
      const index = intersects[i].index;
      const posAttr = points.geometry.attributes.position;
      const position = new THREE.Vector3(posAttr.getX(index),posAttr.getY(index),posAttr.getZ(index));
      const missDist = intersects[0].point.distanceTo(position);
      const size = points.geometry.attributes.size.array[index];
      // if (missDist > size*simScale*0.25) {continue;}
      if (!focusedPoint || !refs.customMaths.vecEqual(position, focusedPoint.position, 1.2))
      {
        noHits=false;
        hoveredObject = {
          intersect: intersects[i],
          position: position,
          size: size,
          isStar: true,
        }
        break;
      }
    }
  }
  
  if (noHits) {hoveredObject = false;}
}
let lastFocusedPoint=null;
function manageStarCube()
{
  if (focusedPoint)
  {
    if (lastFocusedPoint !== focusedPoint)
    {
      const star = universe.getPlanetFromPos({x:focusedPoint.position.x/simScale,y:focusedPoint.position.y/simScale,z:focusedPoint.position.z/simScale});
      const terrainBody = refs.terrainGen.generateTerrainBodyFromStar(star);
      focusedPoint.terrainBody = terrainBody;
      createStarCubeMesh(terrainBody.genData);
      starCube.position.copy(focusedPoint.position);//Simscale already applied
      let rad = (star.size);
      let scale = ((rad)*0.001) * 2; //blocks to ssects
      starCube.scale.copy(new THREE.Vector3(scale,scale,scale));
      starCube.visible=true;
    }
  }
  else
  {
    if (lastFocusedPoint !== focusedPoint)
    {
      starCube.visible=false;
    }
  }
  lastFocusedPoint=focusedPoint;
}
function manageHoverObject()
{
  if (hoveredObject)
  {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    hoverCube.position.copy(hoveredObject.position);
    if (hoveredObject.isStar)
    {
      hoverCube.position.addScaledVector(forward,0.2*simScale);
      let size = hoveredObject.size*0.18;
      hoverCube.scale.set(size,size,0.05);
      hoverCube.quaternion.copy(camera.quaternion);
      // hoverCube.lookAt(camera.position);
    }
    else
    {

      const ax = Math.abs(forward.x);
      const ay = Math.abs(forward.y);
      const az = Math.abs(forward.z);
      const faceIndex = hoveredObject.faceIndex;
      if (faceIndex==0 || faceIndex==1) {forward.set(Math.sign(forward.x), 0, 0);} 
      else if (faceIndex==3 || faceIndex==2) {forward.set(0, Math.sign(forward.y), 0);} 
      else {forward.set(0, 0, Math.sign(forward.z));}
      hoverCube.position.copy(starCube.position);
      
      // console.log("starCube stuff");
      let size = starCube.scale.x*1.02;
      hoverCube.scale.set(0.01,size,size);
      hoverCube.position.addScaledVector(forward, starCube.scale.x*-0.485*simScale);
      // 
      hoverCube.scale.set(size*(1.02-Math.abs(forward.x)),size*(1.02-Math.abs(forward.y)),size*(1.02-Math.abs(forward.z)));
      hoverCube.quaternion.copy(starCube.quaternion);
      // starCube.visible=false;
    }
    if (!hoverCube.visible) {pendingRerender=true; canvasBox.style.cursor="pointer";}
    hoverCube.visible = true;
  } 
  else 
  {
    if (hoverCube.visible) {pendingRerender=true; canvasBox.style.cursor="auto";}
    hoverCube.visible = false;
  }
}




function render()
{
  renderer.render(scene, camera);
}


let renderer = null;
let scene=null;
let raycaster=null;
let hoverCube = null;
let points=null;
let starCube=null;
let camera=null;
function setUpScene()
{
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasBox.clientWidth, canvasBox.clientHeight);
    renderer.domElement.style.width= "100%";
    renderer.domElement.style.height= "100%";
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100000000
    );
    // camera.position.z = 200;

    raycaster = new THREE.Raycaster();raycaster.params.Points.threshold = 1*simScale;
    generateCosmicPoints();
    SendCameraToBasePlanet();
    createHoverCube();
}
function SendCameraToBasePlanet()
{
  // const baseUSect = universe.uSects[universe.baseUSector];
  // const gSect = baseUSect.gSects[universe.baseGSector];
  const basePlanet = universe.getBasePlanet();
  camera.position.x = basePlanet.pos.x*simScale;
  camera.position.y = basePlanet.pos.y*simScale;
  camera.position.z = basePlanet.pos.z*simScale;
  let rad = basePlanet.size;
  const orbitRadius = (rad*0.001)*10*simScale;
  focusedPoint = {type:"star", size:rad*0.001*simScale, position:  camera.position.clone(), orbitRadius:orbitRadius, maxOrbitRadius: orbitRadius*2.5, hasLocked:false}
  camera.position.z -= orbitRadius;
  targQuatC.quaternion = camera.quaternion.clone();
  // const terrainBody = refs.terrainGen.generateTerrainBodyFromStar(basePlanet);
  // createStarCubeMesh(terrainBody.genData);
}

function generateCosmicPoints()
{
    // --- Universe (lots of colored squares) ---
    const starCount = 2000;
    const geometry = new THREE.BufferGeometry();

    const positions = [];
    const sizes = [];
    const colors = [];

    const starBuffer = universe.starData;
    const dtm = refs.dtm;
    universe.uSects.forEach(uSect => {
      if (uSect.isGalaxy)
      {
        // console.log("genning upos: ", uSect.uSectK);
        uSect.gSects.forEach(gSect=>
        {
          if (gSect.isSolarSystem)
          {
            // console.log("genning gpos: ", gSect.gSectK);
            for (let i = gSect.starStart; i < gSect.starStart+gSect.starCount; i++)
            {
              const x = starBuffer.starPsX[i]*simScale; 
              const y = starBuffer.starPsY[i]*simScale; 
              const z = starBuffer.starPsZ[i]*simScale; 
              const type = refs.uniGen.StarBuffer.unpackStarType(starBuffer.starInfos[i]);
              // console.log("star pos: ",x,y,z, i);
              positions.push(x, y, z);
              if (refs.uniGen.StarBuffer.unpackStarSize(starBuffer.starInfos[i])*10 < 30)
              {
                console.log("tiny planet!: ", refs.uniGen.StarBuffer.unpackStarSize(starBuffer.starInfos[i])*10);
              }
              sizes.push(refs.uniGen.StarBuffer.unpackStarSize(starBuffer.starInfos[i])*simScale*starPointScale*10);

              // random colors
              colors.push(...(dtm.planets[type].starColor));//;Math.random(), Math.random(), Math.random());
            }
          }
        });
      }
    });




    for (let i = 0; i < starCount && false; i++) {
    // random positions
    const x = (Math.random() - 0.5) * 2000; 
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;

    positions.push(x, y, z);

    // random colors
    colors.push(Math.random(), Math.random(), Math.random());
    }

    geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3) 
    );
    
    geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
    );
    const sizesArray = new Float32Array(sizes);
    geometry.setAttribute('size', new THREE.BufferAttribute(sizesArray, 1));

    const material = new THREE.ShaderMaterial({
  uniforms: {
    pixelRatio: { value: window.devicePixelRatio }
  },

  vertexShader: `
    attribute float size;
    attribute vec3 color;

    varying vec3 vColor;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      float dist = -mvPosition.z;

      // Desaturation factor
      float desat = min(smoothstep(200.0, 8000.0, dist), 0.9);
      // Convert to grayscale
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      vec3 grayColor = vec3(gray);
      // Final color computed here
      vColor = mix(color, grayColor, desat);

      gl_Position = projectionMatrix * mvPosition;

      // Base size
      float pointSize = size * 5.0;

      // Perspective scaling
      pointSize *= (1.0 / dist);
      pointSize *= 80.0;
      float unshrunkSize = pointSize;

      // Shrink when closer than 4 units
      float shrinkFactor = smoothstep(0.0, 300.0, dist);
      pointSize *= shrinkFactor*shrinkFactor;
      if (shrinkFactor >= 1.0) {pointSize = max(pointSize,1.65);}
      else {pointSize = max(pointSize,unshrunkSize*0.1);}

      gl_PointSize = pointSize;
    }
  `,

  fragmentShader: `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`,

  transparent: true
});

    points = new THREE.Points(geometry, material);
    scene.add(points);
}
function createStarCubeMesh(bodyGenData)
{
    if (starCube) {scene.remove( starCube );}
    // --- Cube (appears when zoomed in) ---
    const cubeGeometry = new THREE.BoxGeometry(simScale, simScale, simScale);

    const cubeMaterials = [
      new THREE.MeshBasicMaterial({ map: createFaceTexture("LEFT", 2, "#00ff00", bodyGenData) }),//left
      new THREE.MeshBasicMaterial({ map: createFaceTexture("RIGHT", 3, "#ff0000", bodyGenData) }),//right
      new THREE.MeshBasicMaterial({ map: createFaceTexture("TOP", 0, "#0000ff", bodyGenData) }),//top
      new THREE.MeshBasicMaterial({ map: createFaceTexture("BOTTOM", 1, "#ffff00", bodyGenData) }),//bottom
      new THREE.MeshBasicMaterial({ map: createFaceTexture("FRONT", 4, "#ff00ff", bodyGenData) }),//front
      new THREE.MeshBasicMaterial({ map: createFaceTexture("BACK", 5, "#00ffff", bodyGenData) })//back
    ];

    starCube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    starCube.visible = false;
    scene.add(starCube);
}
function createHoverCube()
{
    // highlight geometry 
    const markerGeometry = new THREE.BoxGeometry(simScale, simScale, simScale);
    const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff
    });

    hoverCube = new THREE.Mesh(markerGeometry, markerMaterial);
    hoverCube.visible = false;
    scene.add(hoverCube);
}



function createFaceTexture(text, upDir, bgColor, bodyGenData) {
    const size = bodyGenData.radius*2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    let pixelSize=5;
    let cnvOffset=-Math.floor(pixelSize*0.5);
    // if (text ==="BACK")
    {
      let rotate=false;
      let flipX=false; let flipY=false;
      if (upDir==0) {flipX=true;  flipY=false;}//up
      if (upDir==1) {flipY=true;}//down
      if (upDir==2) {rotate=true; flipX=true; flipY=false; }//left
      if (upDir==3) {rotate=true; flipX=false; flipY=true;}//right
      if (upDir==4) {flipX=true; flipY=true;}//front
      const yVal= 0; 
      let offsetX=-bodyGenData.radius; let offsetY = -bodyGenData.radius;
      let blockPosX = 0; let blockPosZ = 0; let blockHeight=0;
      for (let y = 0; y < canvas.height; y+= pixelSize) {
        for (let x = 0; x < canvas.width; x+= pixelSize) {
          blockPosX = x + offsetX; blockPosZ = y + offsetY;
          if (x==0) {blockPosX+=1;} if (y==0) {blockPosZ+=1;}
          let bonusPixX=0;let bonusPixY=0;
          if (x>=canvas.width-pixelSize) {bonusPixX=pixelSize;} if (y>=canvas.height-pixelSize) {bonusPixY=pixelSize;}
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
          blockHeight = flooredSurfHeight;

          worldPos = refs.customMaths.unorientCoordinates(upDir, [blockPosX,blockHeight,blockPosZ]);
          const blockType = refs.terrainGen.sampleBlock( 
            worldPos,     // { x, y, z } 
            upDir,             // string or enum
            bodyGenData,
            null,     // array dirrotindices
            biomeParams,
            false);
          let color = refs.dtm.blockData[blockType].color;
          if ((Math.floor(blockHeight)) % 2==0){color = `color-mix(in hsl, ${color} 92%, black)`;}
          ctx.fillStyle = color;
          let cnvX = x;
          let cnvY = y;
          if (rotate) {let tmp=cnvX; cnvX=cnvY-(flipY?cnvOffset:0); cnvY=tmp-(flipX?cnvOffset:0);}
          if (flipX) {cnvX = canvas.height-cnvX-(pixelSize % canvas.height);} else {cnvX+=cnvOffset;}
          if (flipY) {cnvY = canvas.height-cnvY-(pixelSize % canvas.height);} else {cnvY+=cnvOffset;}
          ctx.fillRect(cnvX, cnvY, pixelSize+bonusPixX, pixelSize+bonusPixY); // 1 pixel per cell
        }
      }
    }

    // text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text + upDir, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function UpdateCosmicPos()
{
  cosmicPos = camera.position;
  cosmicPos = refs.customMaths.vecFloorDiv(cosmicPos,10);
  coordinateText.textContent = `x:${cosmicPos.x}, y:${cosmicPos.y}, z:${cosmicPos.z}`;
}