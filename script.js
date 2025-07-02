import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

//
// === CENA PRINCIPAL (TV NO FUNDO) ===
//
const scene = new THREE.Scene();
scene.background = null;

const isMobile = window.innerWidth < 768;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
function ajustarCameraParaTela() {
  if (window.innerWidth < 768) {
    camera.position.set(0, 1.5, 6);
  } else {
    camera.position.set(0, 1, 5);
  }
  camera.lookAt(0, 3.5, 0);
}
ajustarCameraParaTela();
window.addEventListener('resize', ajustarCameraParaTela);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const alturaCanvas = document.getElementById('tv-container').clientHeight;
renderer.setSize(window.innerWidth, alturaCanvas);
document.getElementById('tv-container').appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(3, 5, 2);
scene.add(dirLight);

let model3D = null;
const objetosClicaveis = [];

const loader = new GLTFLoader();
loader.load('./models/TVVIDEOFINAL.glb', (gltf) => {
  model3D = gltf.scene;
  model3D.scale.set(4, 4, 4);
  model3D.position.set(0, 0, 0);
  model3D.rotation.set(0, 0, 0);
  scene.add(model3D);

  if (isMobile) model3D.rotation.y = Math.PI / 2;

  const video = document.getElementById('video-texture');
  video.muted = true;
  video.play().catch((err) => console.warn('Erro no autoplay:', err));

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;
  videoTexture.encoding = THREE.sRGBEncoding;
  videoTexture.flipY = false;

  model3D.traverse((child) => {
    if (child.isMesh) {
      objetosClicaveis.push(child);
      if (
        child.name === 'TVBase_2_low001_TV_0001' ||
        child.name.includes('Screen')
      ) {
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          transparent: false,
          opacity: 1,
          side: THREE.FrontSide
        });
      }
    }
  });
});

// Clique na TV para ativar som
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let somAtivado = false;

renderer.domElement.addEventListener('click', (event) => {
  if (somAtivado) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objetosClicaveis, true);

  if (intersects.length > 0) {
    const video = document.getElementById('video-texture');
    video.muted = false;
    video.volume = 1.0;
    video.play().then(() => {
      somAtivado = true;
    }).catch((err) => console.warn('Erro ao ativar som:', err));
  }
});

// Scroll tracking
let scrollPercent = 0;
window.addEventListener('scroll', () => {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  let scrollPercentRaw = window.scrollY / maxScroll;
  
  if (window.innerWidth < 768) {
    // Para celular, limitamos para que o scrollPercent "conte" até 0.4, depois fica fixo
    scrollPercent = Math.min(scrollPercentRaw / 0.4, 1);
  } else {
    // Para desktop, usa normal
    scrollPercent = scrollPercentRaw;
  }
});


// Mouse movimento
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -((event.clientY / window.innerHeight) * 2 - 1);
});

// Responsividade
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação da TV
function animate() {
  requestAnimationFrame(animate);

  if (model3D) {
    const z = THREE.MathUtils.lerp(2, -6, scrollPercent);
    const x = THREE.MathUtils.lerp(0, -4, scrollPercent);
    const y = THREE.MathUtils.lerp(0, 6, scrollPercent);

    model3D.position.set(x, y, z);

    let targetRotY = isMobile
      ? THREE.MathUtils.lerp(Math.PI / 2, 0, scrollPercent)
      : THREE.MathUtils.lerp(0, Math.PI / 2, scrollPercent);

    model3D.rotation.y += (targetRotY - model3D.rotation.y) * 0.05;

    const targetRotationY = mouseX * 0.1;
    const targetRotationX = mouseY * 0.05;

    const targetPosX = x + mouseX * 0.1;
    const targetPosY = y + mouseY * 0.05;

    model3D.rotation.y += (targetRotationY - model3D.rotation.y) * 0.05;
    model3D.rotation.x += (targetRotationX - model3D.rotation.x) * 0.05;

    model3D.position.x += (targetPosX - model3D.position.x) * 0.05;
    model3D.position.y += (targetPosY - model3D.position.y) * 0.05;


    // Para celular, mantém como está
    const fadeStartMobile = 0.5;
    const fadeEndMobile = 1.0;

    // Para desktop, acelera o fade para sumir mais rápido
    const fadeStartDesktop = 0.3;  // começa a sumir mais cedo no desktop
    const fadeEndDesktop = 0.6;    // termina sumir mais rápido no desktop

    const fadeStart = isMobile ? fadeStartMobile : fadeStartDesktop;
    const fadeEnd = isMobile ? fadeEndMobile : fadeEndDesktop;

    let opacity = 1;

    if (scrollPercent >= fadeStart) {
      opacity = 1 - (scrollPercent - fadeStart) / (fadeEnd - fadeStart);
      opacity = Math.max(0, opacity);
    }


    model3D.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    });
  }

  renderer.render(scene, camera);
}
animate();


//
// === CENA SECUNDÁRIA: VINIL GIRANDO NA DIV ===
//
const vinilScene = new THREE.Scene();
const vinilCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
vinilCamera.position.z = 5;

const vinilRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
function ajustarTamanhoVinil() {
  const tamanho = window.innerWidth * 0.22;
  vinilRenderer.setSize(tamanho, tamanho);
  
  vinilCamera.aspect = 1; 
  vinilCamera.updateProjectionMatrix();
}

window.addEventListener('resize', ajustarTamanhoVinil);
ajustarTamanhoVinil();
document.getElementById("vinil-container").appendChild(vinilRenderer.domElement);

const vinilLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
vinilScene.add(vinilLight);

let vinilModelo = null;
const vinilLoader = new GLTFLoader();
vinilLoader.load('./models/12_vinyl_record.glb', (gltf) => {
  vinilModelo = gltf.scene;
  vinilModelo.scale.set(11.0, 11.0, 11.0);
  vinilScene.add(vinilModelo);
}, undefined, (err) => {
  console.error('Erro ao carregar vinil:', err);
});

function animateVinil() {
  requestAnimationFrame(animateVinil);
  if (vinilModelo) {
    vinilModelo.rotation.y += 0.02;
  }
  vinilRenderer.render(vinilScene, vinilCamera);
}
animateVinil();


// Mostrar/ocultar o vinil quando a seção estiver visível
const sobreSection = document.querySelector('.sobre-container');
const vinilContainer = document.getElementById('vinil-container');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      vinilContainer.style.opacity = entry.isIntersecting ? '1' : '0';
    });
  },
  { threshold: 0.3 }
);
observer.observe(sobreSection);


// Menu lateral toggle
document.querySelector(".menu-btn").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");
});
document.querySelectorAll("#sidebar a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("active");
  });
});
document.getElementById("fechar-menu")?.addEventListener("click", () => {
  document.getElementById("sidebar").classList.remove("active");
});

// === CENA DO FOGUETE SOBRE A FORMAÇÃO ===
const fogueteScene = new THREE.Scene();
const fogueteCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
fogueteCamera.position.z = 10; // mais perto

const fogueteRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
document.getElementById("formacao-foguete-container").appendChild(fogueteRenderer.domElement);

function redimensionarFogueteCanvas() {
  const largura = window.innerWidth * 0.6;
  const altura = largura * 0.4;
  fogueteRenderer.setSize(largura, altura);
  fogueteCamera.aspect = largura / altura;
  fogueteCamera.updateProjectionMatrix();
}
window.addEventListener("resize", redimensionarFogueteCanvas);
redimensionarFogueteCanvas();

const luzFoguete = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
fogueteScene.add(luzFoguete);

let fogueteModel = null;

const curva = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-10, -5, 0),
  new THREE.Vector3(-4, -2.5, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(4, -1.5, 0),
  new THREE.Vector3(7, 0, 0),
]);


const loaderFoguete = new GLTFLoader();
loaderFoguete.load('./models/foguete.glb', (gltf) => {
  fogueteModel = gltf.scene;

  // Garante visibilidade
  fogueteModel.traverse(child => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      child.material.transparent = false;
      child.material.opacity = 1;
    }
  });

const isMobile = window.innerWidth < 768;
fogueteModel.scale.set(isMobile ? 120 : 50, isMobile ? 120 : 50, isMobile ? 120 : 50);
  fogueteScene.add(fogueteModel);
}, undefined, (err) => {
  console.error("Erro ao carregar foguete:", err);
});

let fogueteT = 0;
let indo = true;

function animateFoguete() {
  requestAnimationFrame(animateFoguete);
  if (fogueteModel) {
    const pos = curva.getPointAt(fogueteT);
    const tangent = curva.getTangentAt(fogueteT);

    fogueteModel.position.copy(pos);
    fogueteModel.lookAt(pos.clone().add(tangent));

    if (indo) {
      fogueteT += 0.002;
      if (fogueteT >= 1) {
        fogueteT = 1;
        indo = false;
      }
    } else {
      fogueteT -= 0.002;
      if (fogueteT <= 0) {
        fogueteT = 0;
        indo = true;
      }
    }
  }

  fogueteRenderer.render(fogueteScene, fogueteCamera);
}

animateFoguete();
