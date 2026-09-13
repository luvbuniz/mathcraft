/* Development only: run in the preview fixture, never loaded by play.html. */
async function renderAvatarPreviews() {
  const grid = document.getElementById('previewResults'); grid.replaceChildren();
  const PV = 320;                                    // higher-res preview for crisp avatars
  const pvScene = new THREE.Scene();                 // transparent so we can paint our own backdrop
  pvScene.add(new THREE.AmbientLight(0xffffff, 0.86));
  const pvLight = new THREE.DirectionalLight(0xffffff, 0.95);
  pvLight.position.set(2.6, 5, 3.2);
  pvScene.add(pvLight);
  const pvFill = new THREE.DirectionalLight(0xc4d8ff, 0.45);   // soft fill from the other side
  pvFill.position.set(-3, 2.2, -2);
  pvScene.add(pvFill);
  const pvCam = new THREE.PerspectiveCamera(37, 1, 0.1, 20);
  pvCam.position.set(0, 1.18, 3.0);                  // a touch closer → heroes read larger
  pvCam.lookAt(0, 0.84, 0);
  // dedicated transparent renderer so each card gets a gradient backdrop + a grounding shadow,
  // which makes both pale (unicorn) and dark (dragon) heroes pop instead of washing out.
  const pvRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  pvRenderer.setClearColor(0x000000, 0);
  pvRenderer.setSize(PV, PV);

  for (const [i, av] of AVATARS.entries()) {
    if (av.hidden) continue;                 // ⏸️ hidden heroes keep working in old saves, just can't be picked
    const card = document.createElement('div');
    card.className = 'avatarCard' + (i === 0 ? ' selected' : '');
    const cv = document.createElement('canvas');
    cv.width = PV; cv.height = PV;
    const nm = document.createElement('div');
    nm.className = 'avName'; nm.textContent = av.name;
    card.appendChild(cv); card.appendChild(nm);
    grid.appendChild(card);

    const ctx = cv.getContext('2d');
    const drawThumb = (group, quad) => {                 // paint one hero onto this card
      group.rotation.y = quad ? 0.85 : 0.5;              // angle quadrupeds to show all four legs
      pvScene.add(group);
      pvRenderer.render(pvScene, pvCam);
      pvScene.remove(group);
      const bg = ctx.createLinearGradient(0, 0, 0, PV);  // medium periwinkle so every hero stands out
      bg.addColorStop(0, '#dbe7f6'); bg.addColorStop(1, '#b7cde8');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, PV, PV);
      ctx.save();                                        // soft ground shadow under the feet
      ctx.translate(PV * 0.5, PV * 0.84); ctx.scale(1, 0.3);
      const sh = ctx.createRadialGradient(0, 0, 2, 0, 0, PV * 0.28);
      sh.addColorStop(0, 'rgba(33,52,82,0.34)'); sh.addColorStop(1, 'rgba(33,52,82,0)');
      ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, PV * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.drawImage(pvRenderer.domElement, 0, 0, PV, PV);   // hero on top of the backdrop
    };
    ROUND_AV = true;
    let data;
    try { data = av.build(); } finally { ROUND_AV = false; }
    drawThumb(data.group, data.quad);
    const addOutput = suffix => {
      const img = document.createElement('img');
      img.src = cv.toDataURL('image/webp', .86);
      img.dataset.file = av.id + suffix + '.webp';
      img.alt = av.name + suffix; img.width = 160; img.height = 160;
      card.appendChild(img);
    };
    addOutput('-classic');
    const mdl = await parseAvatarModel(av.id);
    if (mdl) drawThumb(mdl.group, false);
    addOutput('');
    cv.remove();
    document.getElementById('previewStatus').textContent = 'Rendered ' + av.name;
  }
  pvRenderer.dispose();

 document.getElementById('previewStatus').textContent='Complete: '+grid.querySelectorAll('img').length+' previews';
}
