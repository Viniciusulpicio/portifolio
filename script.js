import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

//
// === CENA PRINCIPAL (TV NO FUNDO) ===
//
// === LOADING MANAGER ===
const manager = new THREE.LoadingManager();
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('progress-bar-fill');
const percentageText = document.getElementById('loader-percentage');

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
    // Ensure we don't divide by zero and clamp
    if(percentageText) percentageText.innerText = percent + "%";
    if(progressBar) progressBar.style.width = percent + "%";
};

manager.onLoad = function () {
    console.log('All assets loaded.');
    if (loadingScreen) {
        // Aesthetic pause at 100%
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.remove();
            }, 800);
        }, 500);
    }
};

// === CENA PRINCIPAL (TV NO FUNDO) ===
const scene = new THREE.Scene();
scene.background = null;

const isMobile = window.innerWidth < 768;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
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
window.addEventListener("resize", ajustarCameraParaTela);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const alturaCanvas = document.getElementById("tv-container").clientHeight;
renderer.setSize(window.innerWidth, alturaCanvas);
document.getElementById("tv-container").appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 3); // Increased intensity
dirLight.position.set(3, 5, 2);
scene.add(dirLight);
const blueLight = new THREE.PointLight(0x302b63, 5, 50); // Ambient purple/blue fill
blueLight.position.set(-2, 3, 5);
scene.add(blueLight);

// ... (rest of code)

let model3D = null;
const objetosClicaveis = [];

const loader = new GLTFLoader(manager);
loader.load("./models/TVVIDEOFINAL.glb", (gltf) => {
  model3D = gltf.scene;
  model3D.scale.set(4, 4, 4);
  model3D.position.set(0, 0, 0);
  model3D.rotation.set(0, 0, 0);
  scene.add(model3D);

  if (isMobile) model3D.rotation.y = 0;

  const video = document.getElementById("video-texture");
  video.muted = true;
  video.play().catch((err) => console.warn("Erro no autoplay:", err));

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
        child.name === "TVBase_2_low001_TV_0001" ||
        child.name.includes("Screen")
      ) {
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          transparent: false,
          opacity: 1,
          side: THREE.FrontSide,
        });
      }
    }
  });
});

// Clique na TV para ativar som
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let somAtivado = false;

renderer.domElement.addEventListener("click", (event) => {
  if (somAtivado) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objetosClicaveis, true);

  if (intersects.length > 0) {
    const video = document.getElementById("video-texture");
    video.muted = false;
    video.volume = 1.0;
    video
      .play()
      .then(() => {
        somAtivado = true;
      })
      .catch((err) => console.warn("Erro ao ativar som:", err));
  }
});

// Scroll tracking
let scrollPercent = 0;
window.addEventListener("scroll", () => {
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
window.addEventListener("mousemove", (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -((event.clientY / window.innerHeight) * 2 - 1);
});

// Responsividade
window.addEventListener("resize", () => {
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
    // Lift TV slightly on mobile start to be more centered
    const startY = isMobile ? 0.5 : 0; 
    const y = THREE.MathUtils.lerp(startY, 6, scrollPercent);

    model3D.position.set(x, y, z);

    let targetRotY = isMobile
      ? THREE.MathUtils.lerp(0, Math.PI / 2, scrollPercent)
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
    const fadeStartDesktop = 0.3; // começa a sumir mais cedo no desktop
    const fadeEndDesktop = 0.6; // termina sumir mais rápido no desktop

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
  let tamanho;
  if (window.innerWidth < 768) {
    tamanho = 250; // Match CSS mobile size
  } else {
    tamanho = window.innerWidth * 0.22;
  }
  vinilRenderer.setSize(tamanho, tamanho);

  vinilCamera.aspect = 1;
  vinilCamera.updateProjectionMatrix();
}

window.addEventListener("resize", ajustarTamanhoVinil);
ajustarTamanhoVinil();
document
  .getElementById("vinil-container")
  .appendChild(vinilRenderer.domElement);

const vinilLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
vinilScene.add(vinilLight);

let vinilModelo = null;
const vinilLoader = new GLTFLoader(manager);
vinilLoader.load(
  "./models/12_vinyl_record.glb",
  (gltf) => {
    vinilModelo = gltf.scene;
    vinilModelo.scale.set(11.0, 11.0, 11.0);
    vinilScene.add(vinilModelo);
  },
  undefined,
  (err) => {
    console.error("Erro ao carregar vinil:", err);
  },
);

function animateVinil() {
  requestAnimationFrame(animateVinil);
  if (vinilModelo) {
    vinilModelo.rotation.y += 0.02;
  }
  vinilRenderer.render(vinilScene, vinilCamera);
}
animateVinil();

// Mostrar/ocultar o vinil quando a seção estiver visível
const sobreSection = document.querySelector(".sobre-container");
const vinilContainer = document.getElementById("vinil-container");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      vinilContainer.style.opacity = entry.isIntersecting ? "1" : "0";
    });
  },
  { threshold: 0.3 },
);
observer.observe(sobreSection);

// Menu lateral toggle
// Menu Mobile Logic
const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector(".sidebar");
const fecharMenu = document.getElementById("fechar-menu");
const links = document.querySelectorAll(".sidebar ul li a");

const toggleMenu = () => {
  if (sidebar) {
      sidebar.classList.toggle("active");
      const isActive = sidebar.classList.contains("active");
      
      // Lock/Unlock Body Scroll
      document.body.style.overflow = isActive ? "hidden" : "";
      
      // Force resize of House canvas when opening
      if (isActive && window.resizeHouseCanvas) {
          setTimeout(window.resizeHouseCanvas, 100);
      }
  }
};

const closeMenu = () => {
  if (sidebar) {
      sidebar.classList.remove("active");
      document.body.style.overflow = ""; // Unlock scroll
  }
};

if (menuBtn) menuBtn.addEventListener("click", toggleMenu);
if (fecharMenu) fecharMenu.addEventListener("click", closeMenu);

links.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// Close on ESC Key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar && sidebar.classList.contains("active")) {
    closeMenu();
  }
});

// === CENA DO FOGUETE SOBRE A FORMAÇÃO ===
// === CENA DO FOGUETE SOBRE A FORMAÇÃO ===
const fogueteScene = new THREE.Scene();
const fogueteCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
fogueteCamera.position.z = 10; // Original distance

const fogueteRenderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
document
  .getElementById("formacao-foguete-container")
  .appendChild(fogueteRenderer.domElement);

function redimensionarFogueteCanvas() {
  const container = document.getElementById("formacao-foguete-container");
  const largura = container.clientWidth;
  // Keep the 300px overflow height to prevent clipping
  const altura = 300; 
  fogueteRenderer.setSize(largura, altura);
  fogueteCamera.aspect = largura / altura;
  fogueteCamera.updateProjectionMatrix();
}
window.addEventListener("resize", redimensionarFogueteCanvas);
redimensionarFogueteCanvas();

const luzFoguete = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
fogueteScene.add(luzFoguete);

let fogueteModel = null;

// isMobile already defined at top of file

const curvePoints = isMobile ? [
  new THREE.Vector3(-4, 0.5, 0),
  new THREE.Vector3(-2, 0, 0),
  new THREE.Vector3(0, -0.5, 0),
  new THREE.Vector3(2, 0, 0),
  new THREE.Vector3(4, 0.5, 0),
] : [
  new THREE.Vector3(-6, 0.5, 0),
  new THREE.Vector3(-3, 0, 0),
  new THREE.Vector3(0, -0.5, 0),
  new THREE.Vector3(3, 0, 0),
  new THREE.Vector3(6, 0.5, 0),
];

const curva = new THREE.CatmullRomCurve3(curvePoints);

const loaderFoguete = new GLTFLoader(manager);
loaderFoguete.load(
  "./models/foguete.glb",
  (gltf) => {
    fogueteModel = gltf.scene;

    fogueteModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        child.material.transparent = false;
        child.material.opacity = 1;
      }
    });

    // Reverting to original scale
    fogueteModel.scale.set(
      isMobile ? 40 : 50,
      isMobile ? 40 : 50,
      isMobile ? 40 : 50,
    );
    fogueteScene.add(fogueteModel);
  },
  undefined,
  (err) => {
    console.error("Erro ao carregar foguete:", err);
  },
);

let fogueteT = 0;
let indo = true;

function animateFoguete() {
  requestAnimationFrame(animateFoguete);
  if (fogueteModel) {
    const pos = curva.getPointAt(fogueteT);
    const tangent = curva.getTangentAt(fogueteT);

    fogueteModel.position.copy(pos);
    fogueteModel.lookAt(pos.clone().add(tangent));
    // Removed manual rotation fixes as they were for the new model orientation logic

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

// --- Scroll Animations ---
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, {
    threshold: 0.1
});

// Select elements to animate
const hiddenElements = document.querySelectorAll('.sobre-texto, #vinil-container, .titulo, .item, .titulo-centralizado, .tech-marquee-container');
hiddenElements.forEach((el) => {
    el.classList.add('hidden'); // Add initial hidden state
    scrollObserver.observe(el);
});


// --- Projects Hover Effect ---
const items = document.querySelectorAll('.project-item');
const preview = document.getElementById('project-preview');

document.addEventListener('mousemove', (e) => {
    // Move the preview to mouse position
    // Adding a slight offset or exact center
    if (preview.style.opacity === '1') {
        const x = e.clientX;
        const y = e.clientY;
        
        // Use requestAnimationFrame for smoother following if needed, 
        // but direct style update is usually fine for simple follow in modern browsers
        preview.style.left = `${x}px`;
        preview.style.top = `${y}px`;
        
        // Optional: Tilt effect based on movement could go here
    }
});

items.forEach(item => {
    item.addEventListener('mouseenter', () => {
        const imageUrl = item.getAttribute('data-image');
        if (imageUrl) {
            preview.style.backgroundImage = `url(${imageUrl})`;
        } else {
            // Fallback if no image
            preview.style.backgroundImage = 'linear-gradient(45deg, #111, #222)';
        }
        
        preview.style.opacity = '1';
        preview.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    item.addEventListener('mouseleave', () => {
        preview.style.opacity = '0';
        preview.style.transform = 'translate(-50%, -50%) scale(0.8)';
    });
});

// --- Custom Cursor Logic ---
const cursor = document.querySelector('.custom-cursor');

document.addEventListener('mousemove', (e) => {
    // Simple direct follow for snappiness
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// Hide default cursor generally or just let them coexist?
// Ideally we hide the default cursor on body if we are confident
document.body.style.cursor = 'none';

// Re-enable default cursor for some interactions if needed, but for brutalist feel, full custom is good.
// But we need to make sure links are clickable. They are.

animateFoguete();

// --- Zoom Portal Logic ---
const zoomPortal = document.querySelector('.zoom-portal');
const zoomText = document.querySelector('.zooming-text');
const aboutContent = document.getElementById('about-content');

if (zoomPortal && zoomText && aboutContent) {
    window.addEventListener('scroll', () => {
        const rect = zoomPortal.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const portalHeight = zoomPortal.clientHeight;
        
        // Calculate how far we are into the portal (sticky section)
        // rect.top goes from viewportHeight (start) to -(portalHeight - viewportHeight) (end)
        // But the content is sticky at top:0, so effective scroll range starts when rect.top <= 0
        
        // We want progress 0 when rect.top = 0
        // And progress 1 when rect.top = -(portalHeight - viewportHeight)
        
        const maxScroll = portalHeight - viewportHeight;
        
        if (rect.top <= 0 && rect.bottom >= viewportHeight) {
            // We are "inside" the active scroll area
            const scrolled = -rect.top;
            let progress = scrolled / maxScroll;
            progress = Math.min(Math.max(progress, 0), 1);
            
            // 1. Zoom Effect
            // Scale increases exponentially for the "entering" feel
            const scale = 1 + (progress * 50); // Massive scale
            zoomText.style.transform = `scale(${scale})`;
            
            // 2. Opacity Fade of Text
            // Start fading out at 50% progress, gone by 90%
            if (progress > 0.5) {
                const opacity = 1 - ((progress - 0.5) / 0.4);
                 zoomText.style.opacity = Math.max(0, opacity);
            } else {
                zoomText.style.opacity = 1;
            }
            
            // 3. Reveal Content
            // Reveal just before the end
            if (progress > 0.85) {
                aboutContent.classList.add('about-content-visible');
                aboutContent.classList.remove('about-content-hidden');
            } else {
                aboutContent.classList.remove('about-content-visible');
                aboutContent.classList.add('about-content-hidden');
            }
            
        } else if (rect.top > 0) {
            // Before section
            zoomText.style.transform = 'scale(1)';
            zoomText.style.opacity = 1;
            aboutContent.classList.remove('about-content-visible');
            aboutContent.classList.add('about-content-hidden');
        } else {
            // After section
            // Keep text hidden/huge so it doesn't flicker if we scroll back up slightly
             zoomText.style.opacity = 0;
             aboutContent.classList.add('about-content-visible');
             aboutContent.classList.remove('about-content-hidden');
        }
    });
}
//
// === CENA TERCIÁRIA: FIRE CHAIR NO FOOTER ===
//
// REMOVED BY USER REQUEST
/*
const footerFireContainer = document.getElementById("footer-fire-container");

if (footerFireContainer) {
  const fireScene = new THREE.Scene();
  // No resizing logic needed for simple footer fill? Or maybe yes.
  // We want it to cover the footer background or sit at bottom.
  
  const fireCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  fireCamera.position.set(0, 1, 3);
  fireCamera.lookAt(0, 0, 0); // Ensure we are looking at the center
  
  const fireRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  fireRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Custom Resize Logic for "Left Side" pinning
  // ... (Lines omitted for brevity in replace description, but actually include everything to line 700)
  // Just replacing the start and searching for the end is safer.
  
  function updateModelPosition() {
      // Logic...
  }
  
  window.addEventListener("resize", () => {
       // logic
  });
  
  const clock = new THREE.Clock(); // Add clock locally if reused
  let fireMixer = null;
  let fireModel = null;

  footerFireContainer.appendChild(fireRenderer.domElement);
  
  // Lights
  const fireAmbientLight = new THREE.AmbientLight(0xffffff, 1.0);
  fireScene.add(fireAmbientLight);
  
  const fireDirLight = new THREE.DirectionalLight(0xff4500, 2); // Orange tint
  fireDirLight.position.set(0, 5, 5);
  fireScene.add(fireDirLight);
  
  const orangeLight = new THREE.PointLight(0xff4500, 5, 10);
  orangeLight.position.set(0, 0, 0);
  fireScene.add(orangeLight);
  
  const loaderFire = new GLTFLoader();
  loaderFire.load(
      "./models/fire_animation.glb",
      (gltf) => {
          fireModel = gltf.scene; // Assign to outer variable
          
          // Scale: Significantly Smaller (requested "menor")
          fireModel.scale.set(0.35, 0.35, 0.35); 

          // Rotation: "Reta" (Straight). 
          // Assuming facing the content (right) is what's desired for a side element.
          fireModel.rotation.set(0, Math.PI / 2, 0);
          
          // Traverse to find and hide the floor/ground
          fireModel.traverse((child) => {
              const name = child.name.toLowerCase();
              // Hide Plane specifically
              if (name.includes('plane') || name.includes('chao') || name.includes('floor')) {
                  child.visible = false;
              }
          });
          
          fireScene.add(fireModel);
          
          // Initial position update
          updateModelPosition();
          
          // Animation
          fireMixer = new THREE.AnimationMixer(fireModel);
          const clips = gltf.animations;
          if (clips && clips.length > 0) {
              clips.forEach((clip) => {
                  fireMixer.clipAction(clip).play();
              });
          }
      },
      undefined,
      (err) => {
          console.error("Erro ao carregar Fire Chair:", err);
      }
  );
  
  function animateFire() {
      requestAnimationFrame(animateFire);
      
      const delta = clock.getDelta();
      if (fireMixer) fireMixer.update(delta);
      
      // Optional: slight camera movement or rotation?
      // fireScene.rotation.y += 0.001;
      
      fireRenderer.render(fireScene, fireCamera);
  }
  
  animateFire();
}
*/

// 
// === CENA TERCIÁRIA: FIRE CHAIR NO FOOTER ===
//
// REMOVED BY USER REQUEST

/*
  // Fire Chair code was here
*/

// --- Loading Screen Logic ---
// Old loading logic replaced by Manager
// window.addEventListener('load', ...);

//
// === CENA QUATERNÁRIA: DRAGÃO (WYVERN) NO TOPO DIREITO ===
//
const wyvernContainer = document.getElementById("wyvern-container");

if (wyvernContainer) {
  const wyvernScene = new THREE.Scene();
  
  const wyvernCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  wyvernCamera.position.set(0, 1, 5); // Default start
  
  const wyvernRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  function resizeWyvernCanvas() {
      const width = wyvernContainer.clientWidth;
      const height = wyvernContainer.clientHeight || 400; 
      wyvernRenderer.setSize(width, height);
      wyvernCamera.aspect = width / height;
      wyvernCamera.updateProjectionMatrix();
  }
  
  window.addEventListener("resize", resizeWyvernCanvas);
  resizeWyvernCanvas();
  
  wyvernContainer.appendChild(wyvernRenderer.domElement);
  
  // Lights
  const wAmbLight = new THREE.AmbientLight(0xffffff, 1.0);
  wyvernScene.add(wAmbLight);
  
  const wDirLight = new THREE.DirectionalLight(0xffaa00, 3);
  wDirLight.position.set(2, 5, 5);
  wyvernScene.add(wDirLight);
  
  let wyvernModel = null;
  let wyvernMixer = null;
  
  const loaderWyvern = new GLTFLoader(manager);
  loaderWyvern.load(
      "./models/wyvern_animated.glb",
      (gltf) => {
          wyvernModel = gltf.scene;
          
          // Position & Scale
          // Raised to 1.7. 
          wyvernModel.position.set(0.8, 2.3, 0); 
          wyvernModel.scale.set(0.2, 0.2, 0.2); 
          
          // Rotation: "Diagonal meio esquerda"
          // -45 degrees (-Math.PI / 4)
          wyvernModel.rotation.set(0, -Math.PI / 4, 0);

          wyvernScene.add(wyvernModel);
          
          // Animation
          wyvernMixer = new THREE.AnimationMixer(wyvernModel);
          const clips = gltf.animations;
          if (clips && clips.length > 0) {
              clips.forEach((clip) => {
                   // Playing all animations might be chaotic, usually index 0 is Idle or Walk
                   // Use playAll for now or just first
                  wyvernMixer.clipAction(clip).play();
              });
          }
      },
      undefined,
      (err) => {
          console.error("Erro ao carregar Wyvern:", err);
      }
  );
  
  // Shared clock or new one? Using existing 'clock' variable if scope allows, 
  // but better create local or reuse carefully. 
  // We already have 'clock' in fire scope. Let's make a new one to be safe 
  // or rename previous to specific. 
  // Actually, we can use a global clock or just delta.
  const wClock = new THREE.Clock();
  
  function animateWyvern() {
      requestAnimationFrame(animateWyvern);
      
      const delta = wClock.getDelta();
      
      if (wyvernModel) {
          // No spin
      }
      
      if (wyvernMixer) wyvernMixer.update(delta);
      
      wyvernRenderer.render(wyvernScene, wyvernCamera);
  }
  
  animateWyvern();
}

//
// === CENA QUINARIA: HONDA CIVIC 98 (PROJECTS) ===
//
const civicContainer = document.getElementById("civic-container");

if (civicContainer) {
  const civicScene = new THREE.Scene();
  
  const civicCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  civicCamera.position.set(3, 2, 5); // Angle view
  civicCamera.lookAt(0, 0, 0);
  
  const civicRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  function resizeCivicCanvas() {
      const width = civicContainer.clientWidth;
      const height = civicContainer.clientHeight || 300; 
      civicRenderer.setSize(width, height);
      civicCamera.aspect = width / height;
      civicCamera.updateProjectionMatrix();
  }
  
  window.addEventListener("resize", resizeCivicCanvas);
  resizeCivicCanvas();
  
  civicContainer.appendChild(civicRenderer.domElement);
  
  // Lights
  const cAmbLight = new THREE.AmbientLight(0xffffff, 1.0);
  civicScene.add(cAmbLight);
  
  const cDirLight = new THREE.DirectionalLight(0xffffff, 2);
  cDirLight.position.set(5, 5, 5);
  civicScene.add(cDirLight);
  
  let civicModel = null;
  // let civicMixer = null; // Use if animated
  
  const loaderCivic = new GLTFLoader(manager);
  loaderCivic.load(
      "./models/honda_civic_type_r_-98_free_asset.glb",
      (gltf) => {
          civicModel = gltf.scene;
          
          // Position & Scale
          civicModel.position.set(0, -0.5, 0); 
          civicModel.scale.set(0.8, 0.8, 0.8); // Start with safe scale
          
          // Rotation
          civicModel.rotation.y = -Math.PI / 4; // Angle it
          
          civicScene.add(civicModel);
      },
      undefined,
      (err) => {
          console.error("Erro ao carregar Civic:", err);
      }
  );
  
  function animateCivic() {
      requestAnimationFrame(animateCivic);
      
      // Auto-rotation? Or just static?
      // User said "Load and Animate" in original, usually easy spin helps 3D feel.
      if (civicModel) {
          civicModel.rotation.y += 0.005; // Slow spin
      }
      
      civicRenderer.render(civicScene, civicCamera);
  }
  
  animateCivic();
}

//
// === CENA SEXTA: FANTASY HOUSE (SIDEBAR) ===
//
const houseContainer = document.getElementById("house-container");

// Define globally immediately
window.resizeHouseCanvas = function() {
  const container = document.getElementById("house-container");
  // Find renderer canvas in container
  const canvas = container ? container.querySelector('canvas') : null;
  
  // We need to access renderer/camera variables which are scoped... 
  // Dispatch a custom event or store variables globally?
  // Easier: Store reference on window if initialized.
  if (window.houseRenderer && window.houseCamera && container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width && height) {
          window.houseRenderer.setSize(width, height);
          window.houseCamera.aspect = width / height;
          window.houseCamera.updateProjectionMatrix();
      }
  }
};

if (houseContainer) {
  console.log("House Script: Starting..."); 
  const houseScene = new THREE.Scene();
  
  const houseCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000); // 5000 to prevent clipping
  houseCamera.position.set(0, 20, 60); 
  
  // OPTIMIZATION: Lighter model allows for better settings
  const houseRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); 
  houseRenderer.setPixelRatio(window.devicePixelRatio); 
  
  // Expose to window for the global resizer
  window.houseRenderer = houseRenderer;
  window.houseCamera = houseCamera;
  
  window.addEventListener("resize", window.resizeHouseCanvas);
  const menuBtn = document.querySelector(".menu-btn");
  if(menuBtn) {
      menuBtn.addEventListener("click", () => {
          setTimeout(window.resizeHouseCanvas, 100); 
      });
  }
  
  window.resizeHouseCanvas();
  houseContainer.appendChild(houseRenderer.domElement);
  
  // Lights
  const hAmbLight = new THREE.AmbientLight(0xffffff, 1.2);
  houseScene.add(hAmbLight);
  
  const hDirLight = new THREE.DirectionalLight(0xffeebb, 1.5); 
  hDirLight.position.set(50, 100, 50);
  houseScene.add(hDirLight);
  
  let houseModel = null;
  let houseMixer = null;
  
  // Loading Manager
  const loadingText = document.createElement('div');
  loadingText.id = 'house-loading-text';
  loadingText.style.position = 'absolute';
  loadingText.style.top = '50%';
  loadingText.style.left = '50%';
  loadingText.style.transform = 'translate(-50%, -50%)';
  loadingText.style.color = 'white';
  loadingText.style.fontFamily = 'Geologica, sans-serif';
  loadingText.style.fontSize = '1.2rem';
  loadingText.innerText = 'Loading House... 0%';
  houseContainer.appendChild(loadingText);
  
  if (!houseContainer) console.error("HOUSE CONTAINER NOT FOUND IN JS");
  
  // Removed local loading text logic to use global manager
  const loaderHouse = new GLTFLoader(manager);
  loaderHouse.load(
      "./models/forest_house.glb", 
      (gltf) => {
          houseModel = gltf.scene;
          
          // Fix Scale: User said "pequena" again. Going HUGE.
          houseModel.scale.set(150.0, 150.0, 150.0); 
          
          // Fix Orientation: User said "100% de costa" (backwards) at -90deg.
          // Trying +90deg (Front?)
          houseModel.rotation.y = Math.PI / 2; 
          
          // Center vertically: User said "em baixo". Raising it up.
          houseModel.position.set(0, -5, 0); 
          
          houseScene.add(houseModel);
          
          // Update Camera 
          houseCamera.position.set(0, 10, 50); 
          houseCamera.lookAt(0, 0, 0);

          // Remove loading text
          if(loadingText) loadingText.remove();
          
          // Animation
          if(gltf.animations.length > 0){
             houseMixer = new THREE.AnimationMixer(houseModel);
             gltf.animations.forEach(clip => houseMixer.clipAction(clip).play());
          }
      },
      (xhr) => {
           if(xhr.total > 0) {
               const percent = Math.floor((xhr.loaded / xhr.total) * 100);
               loadingText.innerText = `Loading House... ${percent}%`;
           } else {
               loadingText.innerText = `Loading...`;
           }
      },
      (err) => {
          console.error("Erro ao carregar House:", err);
          loadingText.innerText = "Error loading 3D Model.";
          loadingText.style.color = "red";
      }
  );
  
  const hClock = new THREE.Clock();
  const sidebarEl = document.getElementById("sidebar"); 

  // CONTROLS: Allow user to rotate manually
  const houseControls = new OrbitControls(houseCamera, houseRenderer.domElement);
  houseControls.enableDamping = true; 
  houseControls.dampingFactor = 0.05;
  houseControls.enableZoom = true; // Allow zoom if they want
  houseControls.autoRotate = false; // Disable auto rotation as requested

  function animateHouse() {
      requestAnimationFrame(animateHouse);
      
      const delta = hClock.getDelta();
      
      // Removed Auto-Rotation
      /* if (houseModel) { houseModel.rotation.y += 0.005; } */
      
      if(houseControls) houseControls.update();
      if(houseMixer) houseMixer.update(delta);
      
      if(sidebarEl && sidebarEl.classList.contains("active")) {
         houseRenderer.render(houseScene, houseCamera);
      }
  }
  
  animateHouse();
};
