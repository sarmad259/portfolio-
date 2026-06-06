/* ═══════════════════════════════════════════════════════════
   Sarmad Khan Portfolio — script.js
   Three.js 3D objects + scroll animations + interactions
   Colors sourced from DESIGN.md tokens (no arbitrary hex)
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── Design Token Colors (matched to style.css) ────────── */
const C = {
  primary:      0xcc785c,   // --color-primary (coral)
  primaryAlpha: '#cc785c',
  teal:         0x5db8a6,   // --color-accent-teal
  amber:        0xe8a55a,   // --color-accent-amber
  dark:         0x181715,   // --color-surface-dark
  hairline:     0xe6dfd8,   // --color-hairline
  onDark:       0xfaf9f5,   // --color-on-dark
  darkElevated: 0x252320,   // --color-surface-dark-elevated
};

/* ─── Utility: isMobile ─────────────────────────────────── */
const isMobile = () => window.innerWidth < 768;

/* ═══════════════════════════════════════════════════════════
   1. TOP NAV — scroll shadow + active link tracking
   ═══════════════════════════════════════════════════════════ */
(function initNav() {
  const nav = document.getElementById('top-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');
  const mobileLinks = overlay.querySelectorAll('.mobile-nav-link');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  /* Scroll: add shadow + backdrop blur */
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);

    /* Active link via section visibility */
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 90;
      if (window.scrollY >= top) current = sec.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile nav toggle */
  function openMobileNav() {
    overlay.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav() {
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeMobileNav() : openMobileNav();
  });
  closeBtn.addEventListener('click', closeMobileNav);
  mobileLinks.forEach(a => a.addEventListener('click', closeMobileNav));
})();


/* ═══════════════════════════════════════════════════════════
   2. SCROLL REVEAL — IntersectionObserver
   ═══════════════════════════════════════════════════════════ */
(function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => io.observe(el));
})();


/* ═══════════════════════════════════════════════════════════
   3. COUNT-UP STATS — hero section
   ═══════════════════════════════════════════════════════════ */
(function initCountUp() {
  const statEls = document.querySelectorAll('.hero-stat-num[data-count]');
  let started = false;

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = target > 1000 ? 2200 : 900;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(eased * target);
      el.textContent = current >= 1000
        ? (current / 1000).toFixed(current % 1000 === 0 ? 0 : 1) + 'k'
        : current;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target >= 1000
        ? (target / 1000).toFixed(0) + 'k'
        : target;
    }
    requestAnimationFrame(step);
  }

  /* Wait until hero stats are visible */
  const heroStats = document.querySelector('.hero-stats');
  if (!heroStats) return;
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      statEls.forEach(el => animateCount(el));
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(heroStats);
})();


/* ═══════════════════════════════════════════════════════════
   4. PROJECT CARDS — 3D CSS Tilt on mouse move
   ═══════════════════════════════════════════════════════════ */
(function initProjectTilt() {
  if (isMobile()) return;
  const cards = document.querySelectorAll('.project-card-inner');

  cards.forEach(card => {
    const MAX_TILT = 10; // degrees

    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const tx = ((x - cx) / cx) * MAX_TILT;
      const ty = -((y - cy) / cy) * MAX_TILT;
      card.style.transition = 'transform 0.08s ease, box-shadow 0.08s ease';
      card.style.transform = `perspective(1000px) rotateX(${ty}deg) rotateY(${tx}deg) translateZ(8px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  });
})();


/* ═══════════════════════════════════════════════════════════
   THREE.JS HELPERS
   ═══════════════════════════════════════════════════════════ */
function makeRenderer(canvas, alpha = true) {
  if (!window.THREE) return null;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    return renderer;
  } catch (e) {
    return null;
  }
}

/** Pause Three.js RAF when canvas is off-screen */
function observedRAF(canvas, animateFn) {
  let rafId = null;
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!rafId) (function loop() { rafId = requestAnimationFrame(loop); animateFn(); })();
    } else {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
  }, { threshold: 0.01 });
  io.observe(canvas);
  return io;
}


/* ═══════════════════════════════════════════════════════════
   5. THREE.JS — HERO NEURAL NETWORK
   30 coral nodes + 60 edges, auto-rotating, mouse parallax
   ═══════════════════════════════════════════════════════════ */
(function initHeroNeural() {
  if (!window.THREE || isMobile()) return;

  const canvas = document.getElementById('hero-canvas');
  const card   = document.getElementById('hero-illustration-card');
  if (!canvas || !card) return;

  const renderer = makeRenderer(canvas);
  if (!renderer) return;

  const w = card.clientWidth;
  const h = card.clientHeight;
  renderer.setSize(w, h);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 0, 7);

  /* ── Nodes ── */
  const NODE_COUNT = 28;
  const nodes = [];
  const nodeGroup = new THREE.Group();

  const nodeMat = new THREE.MeshBasicMaterial({ color: C.primary });
  const nodeGeo = new THREE.SphereGeometry(0.07, 8, 8);

  for (let i = 0; i < NODE_COUNT; i++) {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 1.5 + Math.random() * 1.5;
    mesh.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    mesh.userData = { phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 1.2 };
    nodeGroup.add(mesh);
    nodes.push(mesh);
  }

  /* ── Edges (connect nearest-neighbor pairs) ── */
  const edgeMat = new THREE.LineBasicMaterial({
    color: C.hairline,
    transparent: true,
    opacity: 0.5
  });

  const edgeGroup = new THREE.Group();
  const connected = new Set();

  nodes.forEach((n, i) => {
    /* find 2 closest neighbours */
    const dists = nodes
      .map((m, j) => ({ j, d: n.position.distanceTo(m.position) }))
      .filter(x => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);

    dists.forEach(({ j }) => {
      const key = [Math.min(i, j), Math.max(i, j)].join('-');
      if (connected.has(key)) return;
      connected.add(key);
      const geo = new THREE.BufferGeometry().setFromPoints([
        nodes[i].position, nodes[j].position
      ]);
      edgeGroup.add(new THREE.Line(geo, edgeMat.clone()));
    });
  });

  scene.add(edgeGroup);
  scene.add(nodeGroup);

  /* ── Mouse parallax ── */
  let mx = 0, my = 0;
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width  - 0.5) * 0.6;
    my = ((e.clientY - r.top)  / r.height - 0.5) * 0.6;
  });
  card.addEventListener('mouseleave', () => { mx = 0; my = 0; });

  /* ── Animate ── */
  let t = 0;
  function animate() {
    t += 0.016;
    nodeGroup.rotation.y += 0.004;
    edgeGroup.rotation.y += 0.004;

    /* Smooth camera parallax */
    camera.position.x += (mx - camera.position.x) * 0.06;
    camera.position.y += (-my - camera.position.y) * 0.06;
    camera.lookAt(0, 0, 0);

    /* Node pulse */
    nodes.forEach(n => {
      const s = 0.7 + 0.3 * Math.sin(t * n.userData.speed + n.userData.phase);
      n.scale.setScalar(s);
      n.material.opacity = 0.5 + 0.5 * s;
    });

    renderer.render(scene, camera);
  }

  observedRAF(canvas, animate);

  /* Resize */
  window.addEventListener('resize', () => {
    if (isMobile()) return;
    const nw = card.clientWidth, nh = card.clientHeight;
    renderer.setSize(nw, nh);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
})();


/* ═══════════════════════════════════════════════════════════
   6. THREE.JS — EXPERIENCE ORBITING SPHERE
   Wireframe sphere + 3 orbiting milestone dots
   ═══════════════════════════════════════════════════════════ */
(function initExperienceSphere() {
  if (!window.THREE || isMobile()) return;

  const canvas = document.getElementById('experience-canvas');
  if (!canvas) return;

  const renderer = makeRenderer(canvas);
  if (!renderer) return;

  const SIZE = 400;
  renderer.setSize(SIZE, SIZE);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  /* Wireframe sphere */
  const sphereGeo = new THREE.SphereGeometry(2, 20, 16);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: C.primary,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  /* Inner glow sphere */
  const innerGeo = new THREE.SphereGeometry(1.6, 12, 10);
  const innerMat = new THREE.MeshBasicMaterial({
    color: C.darkElevated,
    transparent: true,
    opacity: 0.6
  });
  scene.add(new THREE.Mesh(innerGeo, innerMat));

  /* 3 orbiting milestone dots (DFKI, Owlvest, Bytewise) */
  const orbitColors = [C.primary, C.teal, C.amber];
  const orbits = orbitColors.map((color, i) => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color })
    );

    /* Orbit ring (visual guide) */
    const ringGeo = new THREE.RingGeometry(2.4 + i * 0.3, 2.42 + i * 0.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color, side: THREE.DoubleSide, transparent: true, opacity: 0.12
    });
    scene.add(new THREE.Mesh(ringGeo, ringMat));
    scene.add(dot);
    return { dot, radius: 2.4 + i * 0.3, speed: 0.4 + i * 0.18, offset: (i * Math.PI * 2) / 3 };
  });

  let t = 0;
  function animate() {
    t += 0.01;
    sphere.rotation.y += 0.006;
    sphere.rotation.x += 0.002;

    orbits.forEach(({ dot, radius, speed, offset }) => {
      const angle = t * speed + offset;
      dot.position.set(
        radius * Math.cos(angle),
        radius * 0.4 * Math.sin(angle * 0.7),
        radius * Math.sin(angle)
      );
    });

    renderer.render(scene, camera);
  }
  observedRAF(canvas, animate);
})();


/* ═══════════════════════════════════════════════════════════
   7. THREE.JS — SKILLS PARTICLE FIELD
   Coral/teal/amber particles drifting upward
   ═══════════════════════════════════════════════════════════ */
(function initSkillsParticles() {
  if (!window.THREE || isMobile()) return;

  const canvas = document.getElementById('skills-canvas');
  const section = document.getElementById('skills');
  if (!canvas || !section) return;

  const renderer = makeRenderer(canvas);
  if (!renderer) return;

  function resize() {
    const w = section.clientWidth;
    const h = section.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  /* Particle geometry */
  const COUNT = 280;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const velocities = [];

  const palette = [
    new THREE.Color(C.primary),
    new THREE.Color(C.teal),
    new THREE.Color(C.amber),
  ];

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
    velocities.push(0.006 + Math.random() * 0.014);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  resize();
  window.addEventListener('resize', resize, { passive: true });

  function animate() {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += velocities[i];
      if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.0008;
    renderer.render(scene, camera);
  }
  observedRAF(canvas, animate);
})();


/* ═══════════════════════════════════════════════════════════
   8. THREE.JS — CTA BAND FLOATING GEOMETRY
   Icosahedra + Octahedra on coral background
   ═══════════════════════════════════════════════════════════ */
(function initCtaGeometry() {
  if (!window.THREE || isMobile()) return;

  const canvas  = document.getElementById('cta-canvas');
  const section = document.getElementById('contact');
  if (!canvas || !section) return;

  const renderer = makeRenderer(canvas);
  if (!renderer) return;

  function resize() {
    const w = section.clientWidth;
    const h = section.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  /* White wireframe material for coral background */
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });

  const shapes = [];
  const geometries = [
    new THREE.IcosahedronGeometry(0.8, 0),
    new THREE.OctahedronGeometry(0.9, 0),
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.OctahedronGeometry(0.6, 0),
    new THREE.IcosahedronGeometry(1.1, 0),
    new THREE.OctahedronGeometry(0.4, 0),
    new THREE.IcosahedronGeometry(0.65, 0),
  ];

  geometries.forEach((geo, i) => {
    const mesh = new THREE.Mesh(geo, wireMat.clone());
    const angle = (i / geometries.length) * Math.PI * 2;
    const r = 4 + Math.random() * 3;
    mesh.position.set(
      r * Math.cos(angle) + (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 2
    );
    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.02,
      rotY: (Math.random() - 0.5) * 0.02,
      floatPhase: Math.random() * Math.PI * 2,
      floatAmp: 0.2 + Math.random() * 0.3,
      baseY: mesh.position.y,
    };
    scene.add(mesh);
    shapes.push(mesh);
  });

  resize();
  window.addEventListener('resize', resize, { passive: true });

  let t = 0;
  function animate() {
    t += 0.012;
    shapes.forEach(s => {
      s.rotation.x += s.userData.rotX;
      s.rotation.y += s.userData.rotY;
      s.position.y = s.userData.baseY + Math.sin(t + s.userData.floatPhase) * s.userData.floatAmp;
    });
    renderer.render(scene, camera);
  }
  observedRAF(canvas, animate);
})();


/* ═══════════════════════════════════════════════════════════
   9. SMOOTH SCROLLING for anchor links
   ═══════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ═══════════════════════════════════════════════════════════
   10. SKILL TILES — hover ripple pulse
   ═══════════════════════════════════════════════════════════ */
(function initSkillTileRipple() {
  document.querySelectorAll('.connector-tile').forEach(tile => {
    tile.addEventListener('mouseenter', () => {
      tile.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.06)' },
        { transform: 'scale(1)' }
      ], { duration: 280, easing: 'ease-out' });
    });
  });
})();


/* ═══════════════════════════════════════════════════════════
   11. HERO ILLUSTRATION CARD — magnetic follow on mouse
   ═══════════════════════════════════════════════════════════ */
(function initHeroMagnetic() {
  if (isMobile()) return;
  const card = document.getElementById('hero-illustration-card');
  if (!card) return;

  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  document.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 400;
    if (dist < maxDist) {
      const factor = (1 - dist / maxDist) * 0.03;
      targetX = dx * factor;
      targetY = dy * factor;
    } else {
      targetX = 0; targetY = 0;
    }
  });

  (function loop() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    card.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(loop);
  })();
})();


/* ═══════════════════════════════════════════════════════════
   12. PAGE LOAD — fade-in body
   ═══════════════════════════════════════════════════════════ */
(function pageLoad() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });
  /* Fallback if load fires before script runs */
  if (document.readyState === 'complete') {
    document.body.style.opacity = '1';
  }
})();
