import './style.css'
import * as THREE from 'three';
import { OrbitControls }  from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OutlineEffect} from 'three/examples/jsm/effects/OutlineEffect.js'; 
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js'
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'; 
import { MeshToonMaterial } from 'three';
import Stats from 'three/examples/jsm/libs/stats.module'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

//TODO:
// add a night mode button
// fill in inside
// branches inside trees
// brighten lamps at night--they could flicker on?
// menu on table that moves up to eye level for projects?
// mailbox for contact me?

/******************************** GLOBAL SETTINGS ***********************************/


let parallax = true;
let cameraPosition = new THREE.Vector3(8, 5, 14);
let shadow = true;

let aboutCameraTarget = new THREE.Vector3(-3, .58, 4.26);
let projectCameraTarget = new THREE.Vector3(-.58, 1.06, 2.06)


let upperYLimit = 10;
let lowerYLimit = 2;
let upperZLimit = 17;
let lowerZLimit = 13;

// render settings
const sceneFile = 'bakery.glb';

/******************************** SCENE CREATION ***********************************/


const scene = new THREE.Scene();
scene.background = new THREE.Color(.52,.8,.92);
//scene.background = new THREE.Color(0xffb3b3);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 2, 40 );
camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
let cameraTarget = new THREE.Vector3(0, 2, 0);
camera.lookAt(cameraTarget);

let pixelRatio = window.devicePixelRatio
let AA = true
if (pixelRatio > 1) {
  //AA = false
}

const renderer = new THREE.WebGLRenderer({antialias: AA, powerPreference: "high-performance"});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio * 1);
if (shadow) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild( renderer.domElement );

let effect = new OutlineEffect(renderer, {
  defaultThickness: 0.003
})

const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth * renderer.getPixelRatio(),
  window.innerHeight * renderer.getPixelRatio(),
  {format: THREE.RGBAFormat,
    colorSpace: THREE.SRGBColorSpace}
)

let controls = new OrbitControls( camera, renderer.domElement );

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), .15, 0.4, 1 ));
composer.addPass(new OutputPass())

const stats = new Stats()
document.body.appendChild(stats.dom)

/******************************** GENERAL LISTENERS ***********************************/

window.addEventListener( 'mousemove', onMouseMove, false );
const mouse = new THREE.Vector2();
const rayMouse = new THREE.Vector2();
function onMouseMove( event ) {
    rayMouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    rayMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.x = ( event.clientX - window.innerWidth/2) / 100;
    mouse.y = ( event.clientY - window.innerHeight/2 ) / 100;
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render( scene, camera );
}



/******************************** LIGHTS ***********************************/


const ambientLight =  new THREE.AmbientLight(0xf2ead0, .471);
scene.add(ambientLight);

const lanternLeft = new THREE.PointLight(0xceba5a, 0, 7.6, .75);
lanternLeft.position.set(-1.3, 2.54, 2.8)
scene.add(lanternLeft)
//lanternLeft.castShadow = true
lanternLeft.shadow.normalBias = 1e-2;

const lanternRight = new THREE.PointLight(0xffae00, 0, 4.5, 1);
lanternRight.position.set(2.62, 2.3, 1.1)
scene.add(lanternRight)
//lanternRight.castShadow = true
lanternRight.shadow.normalBias = 1e-2;

const directionalLight = new THREE.DirectionalLight(0xff643d, 6)
directionalLight.color.set(0xf2f2f2);
scene.add(directionalLight)
console.log(directionalLight)
directionalLight.position.set(-9.87, 6.48, 5.24);
directionalLight.color.set(0xffcccc);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;




/******************************** BAKERY ***********************************/
var gLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( 'node_modules/three/examples/jsm/libs/draco/gltf/' );
gLoader.setDRACOLoader( dracoLoader );

let materialMap = {};

let mixer;
let animations = [];
let newspaperDoor;
let newspaperDoor1;
let fan;

gLoader.load(sceneFile, function(object) {
  mixer = new THREE.AnimationMixer(object.scene)
  animations = object.animations;
  object.scene.traverse(function (child) {
      if (child.isMesh) {
        // set toon materials -> do not duplicate
        if (!(child.material.color.getHex in materialMap)) {
            const format = ( renderer.capabilities.isWebGL2 ) ? THREE.RedFormat : THREE.LuminanceFormat;
            const colors = new Uint8Array(4);
            for ( let c = 0; c <= colors.length; c ++ ) {
                colors[ c ] = ( c / colors.length ) * 256;
            }
            colors[1] = 90;
            colors[3] = 150;
            const gradientMap = new THREE.DataTexture( colors, colors.length, 1, format );
            gradientMap.needsUpdate = true
            let outlineColor = {};
            child.material.color.getHSL(outlineColor)
            outlineColor.l /= 4;
            let newColor = new THREE.Color(1, 1, 1);
            newColor.setHSL(outlineColor.h, outlineColor.s, outlineColor.l)
            materialMap[child.material.color.getHex()] = new MeshToonMaterial({color: child.material.color, gradientMap: gradientMap, side: THREE.FrontSide})
            materialMap[child.material.color.getHex()].userData.outlineParameters = {
              color: [newColor.r, newColor.g, newColor.b]
            }
            
        }
        child.material = materialMap[child.material.color.getHex()]

        // set lantern material to standard -> for bloom
        if (child.name.includes("lanternLight")) {
          console.log(child)
          child.material = new THREE.MeshStandardMaterial({
            toneMapped: false,
            emissive: "yellow",
            emissiveIntensity: 1
          })
        }



        if (child.name.includes("Text") || child.name.includes("bakery") && !child.name.includes("bakery001") || child.name.includes("treeFront")) {
          child.castShadow = true
        }
        child.receiveShadow = true
        if (child.name.includes("window")) {
          child.material.transparent = true;
          child.material.opacity = 0.7
        } else if (child.name.includes("doorWindow")) {
          child.material.transparent = true;
          child.material.opacity = 0.3
        } else if (child.name.includes("newspaperDoor003_1")) {
          newspaperDoor = child;
        } else if (child.name.includes("newspaperDoor003_2")) {
          newspaperDoor1 = child;
        } else if (child.name.includes("fan")) {
          fan = child;
          startFan();
        }
        if (child.name.includes("Text") || child.name.includes("side")) {
          child.material.userData.outlineParameters = {
            color: [0, 0, 0]
          }
        }
        
      }
  })
  scene.add(object.scene);
  startGUI();
  peck();
  object.scene.matrixAutoUpdate = false;
},
function ( xhr ) {
  //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
},
// called when loading has errors
function ( error ) {
  console.log(error );
});



/******************************** SMOKE ************************************/

let smokeGrowth = 1.005
let puffs = [];

function createSmoke() {
  //create sphere of random size
  let smokeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent:true, opacity:.7 } )
  let smokeSize = Math.random() * .1 + 0.07
  let smokeGeometry = new THREE.SphereGeometry(smokeSize, 8, 8);
  let smoke = new THREE.Mesh(
    smokeGeometry, smokeMaterial
  );
  let spawnX = Math.random() * .1 - 1.05
  let spawnZ = Math.random() * .1 -1.45
  smoke.position.set(spawnX, 6, spawnZ)
  scene.add(smoke)
  //add to array, (increase in animate function)
  puffs.push(smoke)
}

/******************************** FAN ***********************************/

function startFan() {
  new TWEEN.Tween(fan.rotation).to({x: 2 * Math.PI}, 2500).repeat(2500).start();
}

/******************************** GUI ***********************************/


function startGUI() {
  const gui = new GUI();
let point = lanternLeft
  const params = {
      'x': point.position.x,
      'y': point.position.y,
      'z': point.position.z,
      'bias': point.shadow.bias,
      'distance': lanternLeft.distance,
      'intensity': lanternLeft.intensity,
      'decay': lanternLeft.decay
  };

  gui.add( params, 'x', -10, 20).onChange( function ( val ) {
      point.position.x = val;
  } );
  gui.add( params, 'y', 0, 20).onChange( function ( val ) {
      point.position.y = val;
  } );
  gui.add( params, 'z', 0, 20).onChange( function ( val ) {
      point.position.z = val;
  } );
  gui.add( params, 'bias', -0.1, .013).onChange( function ( val ) {
    lanternRight.shadow.bias = val;
  } );
  gui.add( params, 'distance', 0, 50).onChange( function ( val ) {
    lanternLeft.distance = val;
  } );
  gui.add( params, 'intensity', 0, 50).onChange( function ( val ) {
    lanternLeft.intensity = val;
  } );
  gui.add( params, 'decay', 0, 2).onChange( function ( val ) {
    lanternLeft.decay = val;
  } );
  gui.addColor(lanternLeft, 'color')
}

/******************************** DAY/NIGHT CYCLE ***********************************/


function timeChange() {
  let timeDelay = 1500
  new TWEEN.Tween(scene.background).to({r: .0325, g: .05, b: .0575}, timeDelay).start();
  new TWEEN.Tween(ambientLight).to({intensity: 0.3}, timeDelay).start()
  new TWEEN.Tween(ambientLight.color).to({r: .509, g: .702, b: .753}, timeDelay).start()
  new TWEEN.Tween(directionalLight).to({intensity: 0}, timeDelay).start()
  new TWEEN.Tween(pointLight).to({intensity: 0}, timeDelay).start()


  new TWEEN.Tween(lanternLeft).to({intensity: 5}, timeDelay + 2000).start()
  new TWEEN.Tween(lanternRight).to({intensity: 15}, timeDelay + 2000).start()
}


document.body.addEventListener('click', timeChange)

/******************************** TAB TRANSITIONS ***********************************/

document.getElementById("about").addEventListener('click', goToAbout)
document.getElementById("projects").addEventListener('click', goToProjects)

function goToAbout() {
  //new TWEEN.Tween(cameraTarget).to({x: aboutCameraTarget.x, y: aboutCameraTarget.y, z: aboutCameraTarget.z}, 2500).start()
  new TWEEN.Tween(camera.position).to({x:8.33, y:.5, z:8.16}, 2500).easing(TWEEN.Easing.Quintic.InOut).start();
  setTimeout(openNewspaper, 2000)
}

function openNewspaper() {
  new TWEEN.Tween(newspaperDoor.rotation).to({z: -.5}, 1500).easing(TWEEN.Easing.Bounce.Out).start();
  new TWEEN.Tween(newspaperDoor1.rotation).to({z: -.5}, 1500).easing(TWEEN.Easing.Bounce.Out).start()
}

function goToProjects() {
  new TWEEN.Tween(cameraTarget).to({x: projectCameraTarget.x, y: projectCameraTarget.y, z: projectCameraTarget.z}, 2500).start()
  new TWEEN.Tween(camera.position).to({x:.66, y:1.8, z:5.5}, 2500).easing(TWEEN.Easing.Quintic.InOut).start();
}


/******************************** BIRD & CRUMBS ***********************************/

// Update the mixer on each frame

let peckedTwice = false;
let mixerUpdateTime = .03

function update () {
  
	mixer.update( mixerUpdateTime );
  if (!peckedTwice && mixer.time % 24.875 >= 4) {
    peckedTwice = true;
    crumbsFly(false);
  } else if (mixer.time % 24.875 <= mixerUpdateTime * 2) {
    peckedTwice = false;
    crumbsFly(true)
  }
}

let donePecking = true;

function peck() {
  let ani = mixer.clipAction(animations[0]);
  ani.play();
  crumbsFly(true);
}

let crumbs = [];
function crumbsFly(left) {
  let crumbPosition;
  if (left) {
    crumbPosition = new THREE.Vector3(2.1, 0, 2)
  } else {
    crumbPosition = new THREE.Vector3(2.14, 0, 1.32)
  }
  let crumbGeometry = new THREE.SphereGeometry(.01, 8, 8)
  let crumbMaterial = new THREE.MeshToonMaterial({color: 0xB7916D, transparent: true, opacity: 1})
  for (let i = 0; i < 10; i++) {
    let crumb = new THREE.Mesh(crumbGeometry, crumbMaterial)
    new TWEEN.Tween(crumb.material).to({opacity: 0}, 5000).start()
    scene.add(crumb)
    crumb.position.set(crumbPosition.x, crumbPosition.y, crumbPosition.z);
    let crumbObject = {
      "mesh": crumb,
      "amplitude": Math.random() * -.4,
      "time": 0,
      "theta": Math.random() * 2 * Math.PI,
      "crumbPosition": crumbPosition
    }
    crumbs.push(crumbObject)
  }
}

function updateCrumbs() {
  for (let i = 0; i < crumbs.length; i++) {
    crumbs[i]["time"] += .03;
    let curTime = crumbs[i]["time"];
    let amp = crumbs[i]["amplitude"]
    let crumb = crumbs[i]["mesh"];
    let angle = crumbs[i]["theta"];
    let crumbPosition = crumbs[i]["crumbPosition"]
    if (crumb.position.y >= 0) {
      crumb.position.set(crumbPosition.x + 2*amp*curTime*Math.cos(angle), crumbPosition.y + (-1 * Math.pow((curTime + 1.5*amp), 2)) + Math.pow(1.5*amp, 2), crumbPosition.z + 2*amp*curTime*Math.sin(angle))
    }
    if (crumb.material.opacity <= 0.1) {
      scene.remove(crumb)
      crumb.geometry.dispose();
      crumb.material.dispose();
      crumbs.splice(i, 1)
    }
  }
}

/******************************** ANIMATE ***********************************/

setTimeout(function() {renderer.shadowMap.autoUpdate = false;}, 2000)
function animate() {
  stats.begin()
  
  requestAnimationFrame( animate );
    
    
  
  update();
  
  let smokeChance = Math.random()
  if (smokeChance < 0.1) {
    createSmoke();
  }

  if (crumbs.length > 0) {
    updateCrumbs();
  }

  puffs.forEach((puff) => {
    puff.position.y += .02;
    puff.scale.set(puff.scale.x * smokeGrowth, puff.scale.y * smokeGrowth, puff.scale.z * smokeGrowth)
    puff.material.opacity -= 0.005
    if (puff.material.opacity <= 0) {
      scene.remove(puff)
      puff.geometry.dispose()
      puffs.splice(puffs.indexOf(puff), 1)
    }
  });
  
  // MOUSE PARALLAX
  
  if (parallax) {
      let newZ = camera.position.z + (cameraPosition.z + mouse.x - camera.position.z) * .01 ;
      let newY = camera.position.y + (cameraPosition.y - mouse.y - camera.position.y) * .01 ;
      if (newZ < upperZLimit && newZ > lowerZLimit) {
        camera.position.z = newZ
      }
      if (newY < upperYLimit && newY > lowerYLimit) {
        camera.position.y = newY
      }
  }
  
  camera.lookAt(cameraTarget);
  effect.render(scene, camera);
 // composer.render();
  TWEEN.update();
  stats.end()
};

animate();