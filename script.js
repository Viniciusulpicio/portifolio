import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene = new THREE.Scene();
const isMobile = window.innerWidth < 768;
scene.background = new THREE.Color(0xb8a1f7);


let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

// Função que ajusta a posição da câmera conforme a largura da tela
function ajustarCameraParaTela() {
  if (window.innerWidth < 768) {
    camera.position.set(0, 1.5, 6); // Mais longe para telas pequenas
  } else {
    camera.position.set(0, 1, 5); // Padrão para desktop
  }
  camera.lookAt(0, 3.5, 0);
}

// Chama uma vez no início
ajustarCameraParaTela();

// E sempre que a janela for redimensionada
window.addEventListener('resize', ajustarCameraParaTela);


let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('tv-container').appendChild(renderer.domElement);

// Luz
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
let dirLight = new THREE.DirectionalLight(0xffffff, 2);
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
if (isMobile) {
  model3D.rotation.y = Math.PI / 2; // 90° de lado
}

  const video = document.getElementById('video-texture');
  video.muted = true;  // Começa mudo
  video.play().catch((err) => console.warn('Erro no autoplay do vídeo:', err));

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;  // <-- Mude de RGBFormat para RGBAFormat
  videoTexture.generateMipmaps = false;
  videoTexture.encoding = THREE.sRGBEncoding;
  videoTexture.flipY = false;  


  model3D.traverse((child) => {
    if (child.isMesh) {
      objetosClicaveis.push(child);


      if (child.name === 'TVBase_2_low001_TV_0001' || child.name.includes('Screen')) {
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

// Raycaster para clique
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
    console.log('Clicou na TV:', intersects[0].object.name);

    const video = document.getElementById('video-texture');
    video.muted = false;
    video.volume = 1.0;
    video.play().then(() => {
      console.log('Som ativado!');
      somAtivado = true;
    }).catch((err) => {
      console.warn('Erro ao ativar som:', err);
    });
  } else {
    console.log('Clique fora da TV. Som não ativa.');
  }
});

// Scroll tracking
let scrollPercent = 0;
window.addEventListener('scroll', () => {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  scrollPercent = window.scrollY / maxScroll;
});

// Responsividade
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Movimento baseado no mouse
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -((event.clientY / window.innerHeight) * 2 - 1);
});

function animate() {
  requestAnimationFrame(animate);

  if (model3D) {
    const z = THREE.MathUtils.lerp(2, -6, scrollPercent);
    const x = THREE.MathUtils.lerp(0, -4, scrollPercent);
    const y = THREE.MathUtils.lerp(0, 6, scrollPercent);

    model3D.position.set(x, y, z);

    let targetRotY = 0;
    if (isMobile) {
      targetRotY = THREE.MathUtils.lerp(Math.PI / 2, 0, scrollPercent);
    } else {
      targetRotY = THREE.MathUtils.lerp(0, Math.PI / 2, scrollPercent);
    }
    model3D.rotation.y += (targetRotY - model3D.rotation.y) * 0.05;


    const targetRotationY = mouseX * 0.1;
    const targetRotationX = mouseY * 0.05;

    const targetPosX = x + mouseX * 0.1;
    const targetPosY = y + mouseY * 0.05;

    model3D.rotation.y += (targetRotationY - model3D.rotation.y) * 0.05;
    model3D.rotation.x += (targetRotationX - model3D.rotation.x) * 0.05;

    model3D.position.x += (targetPosX - model3D.position.x) * 0.05;
    model3D.position.y += (targetPosY - model3D.position.y) * 0.05;

    const fadeStart = 0.5;
    const fadeEnd = 1.0;
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


document.querySelector(".menu-btn").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");
});
document.querySelectorAll("#sidebar a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("active");
  });
});
