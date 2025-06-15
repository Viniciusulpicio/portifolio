import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8a1f7);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 5);
camera.lookAt(0, 3.5, 0);

let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('tv-container').appendChild(renderer.domElement);

// Luz
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
let dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(3, 5, 2);
scene.add(dirLight);

// Modelo 3D
let model3D = null;
const loader = new GLTFLoader();
// Após carregar o modelo
loader.load('./models/TVVideoTeste.glb', (gltf) => {
  model3D = gltf.scene;
  model3D.scale.set(4, 4, 4);
  model3D.position.set(0, 0, 0);
  model3D.rotation.set(0, 0, 0);
  scene.add(model3D);

  // MOSTRA OS NOMES DOS OBJETOS
  model3D.traverse((child) => {
    if (child.isMesh) {
      console.log('Mesh:', child.name);

    const video = document.getElementById('video-texture');

    // Espera o clique do usuário para ativar som
    window.addEventListener('click', () => {
      video.muted = false;
      video.volume = 1.0;
      video.play().then(() => {
        console.log('Vídeo com som reproduzindo');
      }).catch((err) => {
        console.warn('Erro ao tentar tocar vídeo com som:', err);
      });
    });


      // Garante que o vídeo está mudo
      video.muted = true;

      // Tenta dar play
      video.play().then(() => {
        console.log('Vídeo reproduzindo');
      }).catch((error) => {
        console.warn('Falha ao dar play automático no vídeo:', error);
      });
      

      const videoTexture = new THREE.VideoTexture(video);

      if (child.name === 'TVBase_2_low001_TV_0') {
        console.log('Aplicando textura no TV_0');
      }
      videoTexture.flipY = false;


      if (child.name === 'TVBase_2_low001_TV_0001') {
        console.log('Aplicando textura no TV_0001');
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          transparent: false,
          opacity: 1,
          side: THREE.FrontSide
        });
      }
    }
  });

  // Seleciona o vídeo
  const video = document.getElementById('video-texture');

  // Cria uma textura do vídeo
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;

  // Substitui o material da tela da TV
  model3D.traverse((child) => {
    if (child.isMesh && child.name.includes('Screen')) { // ajuste esse nome com base no log
      child.material = new THREE.MeshBasicMaterial({ map: videoTexture });
    }
  });

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

// Movimento suave baseado no mouse
let mouseX = 0; // normalizado entre -1 e 1
let mouseY = 0;

window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -((event.clientY / window.innerHeight) * 2 - 1); // inverte para ficar intuitivo
});

function animate() {
  requestAnimationFrame(animate);

  if (model3D) {
    // Movimento baseado no scroll (posição e rotação)
    const z = THREE.MathUtils.lerp(2, -6, scrollPercent);
    const x = THREE.MathUtils.lerp(0, -4, scrollPercent);
    const y = THREE.MathUtils.lerp(0, 6, scrollPercent);
    const rotY = THREE.MathUtils.lerp(0, Math.PI / 2, scrollPercent);

    // Define posição e rotação base do scroll
    model3D.position.set(x, y, z);
    model3D.rotation.y = rotY;

    // Movimento sutil adicional baseado no mouse
    const targetRotationY = mouseX * 0.1;
    const targetRotationX = mouseY * 0.05;

    const targetPosX = x + mouseX * 0.1;
    const targetPosY = y + mouseY * 0.05;

    // Interpola suavemente para o alvo (lerp com fator 0.05)
    model3D.rotation.y += (targetRotationY - model3D.rotation.y) * 0.05;
    model3D.rotation.x += (targetRotationX - model3D.rotation.x) * 0.05;

    model3D.position.x += (targetPosX - model3D.position.x) * 0.05;
    model3D.position.y += (targetPosY - model3D.position.y) * 0.05;

    // Fade-out no final do scroll (entre 50% e 100%)
    const fadeStart = 0.5;
    const fadeEnd = 1.0;
    let opacity = 1;

    if (scrollPercent >= fadeStart) {
      opacity = 1 - (scrollPercent - fadeStart) / (fadeEnd - fadeStart);
      opacity = Math.max(0, opacity);
    }
        const textoFade = document.getElementById('texto-fade');

        if (scrollPercent >= 0.55) {
        textoFade.style.opacity = '1';
        } else {
        textoFade.style.opacity = '0';
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
