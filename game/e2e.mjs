// Kịch bản bot tự chơi "Chạy Đâu Đây?" (2-environment/bot.mjs gọi hàm play).
//   evaluate(js) · click(selector) · shot(nhãn) · check(tên, đúng?, chi tiết) · sleep(ms)
export async function play({ evaluate, click, shot, check, sleep }) {
  const S = () => evaluate('window.__game.state()');
  const visible = (sel) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const r = el.getBoundingClientRect(); return !el.closest('[hidden]') && r.width > 0 && r.height > 0; })()`);
  const text = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? ''`);
  const height = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().height`);
  // Chạm vào canvas #field tại toạ độ (x, y) tính bằng pixel CSS trong canvas.
  const tap = (x, y) => evaluate(`(() => { const c = document.getElementById('field'); const r = c.getBoundingClientRect();
    c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + ${x}, clientY: r.top + ${y} })); })()`);
  const fieldSize = () => evaluate(`(() => { const r = document.getElementById('field').getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
  const tapCorrect = async () => { const z = (await S()).zoneScreen; await tap(z.x, z.y); };
  const tapWrong = async () => { const f = await fieldSize(); await tap(8, f.h - 8); }; // mặt cỏ ngay dưới chân, xa vùng đúng
  // F8: chờ tới khi state().phase = want (tối đa ms). Trả về số ms đã chờ, hoặc -1 nếu hết giờ.
  const waitPhase = async (want, ms = 3000) => {
    const t0 = Date.now();
    while (Date.now() - t0 <= ms) {
      if ((await S()).phase === want) return Date.now() - t0;
      await sleep(50);
    }
    return -1;
  };
  const waitDecide = () => waitPhase('decide');
  const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // F11: sự kiện tracking ghi trong window.__events
  const events = () => evaluate('(window.__events || []).map((e) => ({ name: e.name, params: e.params }))');
  const lastEv = async (name) => (await events()).filter((e) => e.name === name).pop() ?? null;

  // ---------------- F3 · màn mở đầu
  check('F3: mở trang thấy #screen-start', await visible('#screen-start'));
  check('F3: có khiên #crest', await visible('#crest'));
  const logo = await evaluate(`(async () => { const i = document.getElementById('logo'); if (!i.complete) await new Promise((r) => { i.onload = r; i.onerror = r; }); return i.naturalWidth; })()`);
  check('F3: logo CLB #logo tải được (naturalWidth > 0)', logo > 0, `${logo}px`);
  check('F3: có chữ ULTIMATE', (await text('#screen-start')).includes('ULTIMATE'));
  const hH = await height('#role-handler');
  const hC = await height('#role-cutter');
  check('F3: nút #role-handler và #role-cutter cao ≥ 44px', hH >= 44 && hC >= 44, `${Math.round(hH)}px, ${Math.round(hC)}px`);
  const bg = await evaluate(`getComputedStyle(document.body).backgroundImage`);
  check('F3: nền body là radial-gradient', bg.includes('radial-gradient'), bg.slice(0, 40));
  const titleFont = await evaluate(`getComputedStyle(document.querySelector('.w-ultimate')).fontFamily`);
  check('F3: font tiêu đề không phải font mặc định (Montserrat)', /montserrat/i.test(titleFont), titleFont);
  // ---------------- F9 · nút toàn màn hình ở màn mở đầu
  const fsBtn = async () => evaluate(`(() => { const b = document.getElementById('fullscreen'); if (!b) return null; const r = b.getBoundingClientRect();
    return { w: r.width, h: r.height, label: b.getAttribute('aria-label') || '' }; })()`);
  let fb0 = await fsBtn();
  check('F9: màn mở đầu có nút #fullscreen ≥ 40×40px, có aria-label', !!fb0 && (await visible('#fullscreen')) && fb0.w >= 40 && fb0.h >= 40 && fb0.label.length > 0,
    fb0 ? `${Math.round(fb0.w)}×${Math.round(fb0.h)}px "${fb0.label}"` : 'không có nút');
  check('F11: mở trang → window.__events có game_open', !!(await lastEv('game_open')));
  const gaScripts = await evaluate(`[...document.scripts].filter((x) => (x.src || '').includes('googletagmanager.com')).length`);
  check('F11: GA_ID trống → không tải script googletagmanager.com', gaScripts === 0, `${gaScripts} script`);
  // ---------------- F12 · màn mở đầu dễ hiểu
  const hp = await height('#play');
  check('F12: lần đầu mở trang có nút #play cao ≥ 48px, chữ "Chơi ngay"', (await visible('#play')) && hp >= 48 && (await text('#play')).includes('Chơi ngay'),
    `${Math.round(hp)}px "${(await text('#play')).trim()}"`);
  check('F12: #role-cutter có chữ "Người chạy", #role-handler có chữ "Người ném"',
    (await text('#role-cutter')).includes('Người chạy') && (await text('#role-handler')).includes('Người ném'),
    `${(await text('#role-cutter')).trim()} / ${(await text('#role-handler')).trim()}`);
  // ---------------- F13 · nút âm thanh
  const snd = await evaluate(`(() => { const b = document.getElementById('sound'); if (!b) return null; const r = b.getBoundingClientRect();
    return { w: r.width, h: r.height, pressed: b.getAttribute('aria-pressed') }; })()`);
  check('F13: có nút #sound ≥ 40px với aria-pressed', !!snd && snd.w >= 40 && snd.h >= 40 && ['true', 'false'].includes(snd.pressed),
    snd ? `${Math.round(snd.w)}×${Math.round(snd.h)} aria-pressed=${snd.pressed}` : 'không có nút');
  const sound0 = (await S()).sound;
  await click('#sound');
  await sleep(100);
  const sound1 = (await S()).sound;
  const stored1 = await evaluate(`localStorage.getItem('cdd-sound')`);
  await click('#sound');
  await sleep(100);
  const sound2 = (await S()).sound;
  const stored2 = await evaluate(`localStorage.getItem('cdd-sound')`);
  check('F13: bấm #sound → state().sound đổi, localStorage cdd-sound đổi theo; bấm lại → như cũ',
    typeof sound0 === 'boolean' && sound1 === !sound0 && sound2 === sound0 && stored1 === (sound1 ? '1' : '0') && stored2 === (sound2 ? '1' : '0'),
    `${sound0} → ${sound1} (${stored1}) → ${sound2} (${stored2})`);
  // ---------------- F15 · mục tiêu + luật Ultimate
  const gl = await text('#goal-line');
  check('F15: #goal-line có "Mục tiêu" và "Sai 3 lần"', gl.includes('Mục tiêu') && gl.includes('Sai 3 lần'), gl);
  const rb = await height('#rules-btn');
  check('F15: nút #rules-btn hiện, cao ≥ 44px', (await visible('#rules-btn')) && rb >= 44, `${Math.round(rb)}px`);
  await click('#rules-btn');
  await sleep(250);
  const nRules = await evaluate(`document.querySelectorAll('#rules .rule').length`);
  check('F15: bấm #rules-btn → #rules hiện 6 dòng .rule, có "10 giây"', (await visible('#rules')) && nRules === 6 && (await text('#rules')).includes('10 giây'), `${nRules} dòng`);
  check('F15: mở luật → window.__events có rules_open', !!(await lastEv('rules_open')));
  await shot('F15 · Luật Ultimate trong 30 giây');
  await click('#rules-close');
  await sleep(150);
  check('F15: bấm #rules-close → #rules ẩn', !(await visible('#rules')));
  await shot('Màn mở đầu kiểu logo CLB');

  const tClick = Date.now();
  await click('#role-cutter');
  await sleep(350);
  let s = await S();
  check('F3: bấm #role-cutter thì hiện #screen-play', await visible('#screen-play'));
  check('F3: state().role = cutter', s.role === 'cutter', s.role);
  const rs = await lastEv('role_select');
  check('F11: chọn Cutter → role_select với role = cutter', rs?.params.role === 'cutter', JSON.stringify(rs?.params));
  const ps1 = await lastEv('point_start');
  check('F11: rồi point_start với attempt = 1', ps1?.params.attempt === 1, JSON.stringify(ps1?.params));

  // ---------------- F13 · đếm ngược lúc vào pha · F14 · dáng chạy
  const cd = await evaluate(`(() => { const el = document.getElementById('countdown'); return { shown: !!el && !el.hidden && el.getBoundingClientRect().width > 0, text: el ? el.textContent : '' }; })()`);
  check('F13: lúc vào pha #countdown hiện chữ số đếm ngược', cd.shown && /^[123]$/.test(cd.text), JSON.stringify(cd));
  check('F14: lúc vào pha có ≥ 1 người được vẽ dáng chạy (drawn.running ≥ 1)', (s.drawn?.running ?? 0) >= 1, `running=${s.drawn?.running}`);

  // ---------------- F8 · vào pha bóng: bạn chạy vào, cả sân chạy
  check('F8: vừa chọn vai thì state().phase = intro', s.phase === 'intro', s.phase);
  await shot('Vào pha bóng — bạn và cả sân đang chạy');
  const c1 = s.live.camera;
  await tapCorrect();
  await sleep(300);
  s = await S();
  check('F8: chạm lúc đang vào pha thì không tính (answered vẫn false)', s.answered === false);
  check('F8: camera đang chạy (đổi chỗ ≥ 0.3m sau 300ms)', gap(c1, s.live.camera) >= 0.3, `${gap(c1, s.live.camera).toFixed(2)}m`);
  await waitDecide();
  const introMs = Date.now() - tClick;
  check('F8: trong ≤ 2.5 giây chuyển sang phase = decide', (await S()).phase === 'decide' && introMs <= 2500, `${introMs}ms`);
  check('F13: sang decide thì #countdown ẩn', !(await visible('#countdown')));
  const scen = (await S()).drawn?.scenery;
  const px = await evaluate(`(() => { const c = document.getElementById('field'); const x = c.getContext('2d');
    const at = (fx, fy) => { const d = x.getImageData(Math.floor(c.width * fx), Math.floor(c.height * fy), 1, 1).data; return [d[0], d[1], d[2]]; };
    return { sky: at(0.5, 0.01), grass: at(0.5, 0.97) }; })()`);
  const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  check('F14: trời ban ngày — điểm trên cùng sáng (> 0.45) và xanh da trời (B > R)', lum(px.sky) > 0.45 && px.sky[2] > px.sky[0], `sky rgb(${px.sky}) sáng ${lum(px.sky).toFixed(2)}`);
  check('F14: cỏ dưới chân màu xanh lá (G lớn nhất)', px.grass[1] > px.grass[0] && px.grass[1] > px.grass[2], `grass rgb(${px.grass})`);
  check('F14: cảnh có ≥ 2 đám mây, 2 lớp cây, ≥ 1 cột đèn', scen?.clouds >= 2 && scen?.trees >= 2 && scen?.lights >= 1, JSON.stringify(scen));
  const mA = (await S()).live.mates;
  await sleep(300);
  const mB = (await S()).live.mates;
  const moved = Math.max(...mA.map((p, i) => gap(p, mB[i])));
  check('F8: lúc chờ chạm, đồng đội vẫn di chuyển (lệch > 0 sau 300ms)', moved > 0.01, `${moved.toFixed(2)}m`);

  // ---------------- F10 · mạng, điểm trận, đếm stall
  const hearts = async () => ((await text('#lives')).match(/❤️/g) || []).length;
  check('F10: #lives có 3 ❤️ khi vào point', (await hearts()) === 3, await text('#lives'));
  check('F10: #points = 0 khi vào point', Number(await text('#points')) === 0, await text('#points'));
  check('F10: #stall hiện chữ "Stall" ở pha decide', (await visible('#stall')) && (await text('#stall')).includes('Stall'), await text('#stall'));
  await sleep(1300);
  const st = (await S()).stall;
  check('F10: sau 1.5 giây số stall ≥ 2', st >= 2, `stall=${st}`);
  await shot('Đếm stall đang chạy — 3 mạng, điểm trận 0');
  s = await S();

  // ---------------- F1 · sân góc nhìn thứ nhất
  const isCanvas = await evaluate(`document.getElementById('field')?.tagName === 'CANVAS'`);
  const f = await fieldSize();
  check('F1: #field là <canvas> và hiện trên màn chơi', isCanvas && (await visible('#field')));
  check('F1: #field rộng ≤ 390px', f.w <= 390, `${Math.round(f.w)}px`);
  check('F1: state().camera có x, y, heading', ['x', 'y', 'heading'].every((k) => typeof s.camera?.[k] === 'number'), JSON.stringify(s.camera));

  // ---------------- F9 · sân phủ cả cửa sổ, chữ nằm đè lên sân
  const cover = await evaluate(`(() => { const r = document.getElementById('field').getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, iw: innerWidth, ih: innerHeight, sh: document.documentElement.scrollHeight }; })()`);
  check('F9: #field phủ cả cửa sổ (góc (0,0), rộng = innerWidth, cao = innerHeight, ±1px)',
    Math.abs(cover.x) <= 1 && Math.abs(cover.y) <= 1 && Math.abs(cover.w - cover.iw) <= 1 && Math.abs(cover.h - cover.ih) <= 1,
    `(${Math.round(cover.x)},${Math.round(cover.y)}) ${Math.round(cover.w)}×${Math.round(cover.h)} / cửa sổ ${cover.iw}×${cover.ih}`);
  check('F9: trang không cuộn dọc (scrollHeight ≤ innerHeight + 1)', cover.sh <= cover.ih + 1, `${cover.sh} / ${cover.ih}`);
  const inside = (sel) => evaluate(`(() => { const a = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); const f = document.getElementById('field').getBoundingClientRect();
    return a.width > 0 && a.top >= f.top - 1 && a.bottom <= f.bottom + 1 && a.left >= f.left - 1 && a.right <= f.right + 1; })()`);
  check('F9: HUD #score nằm trong khung sân (lớp phủ)', await inside('#score'));
  check('F9: thẻ #prompt nằm trong khung sân (lớp phủ)', await inside('#prompt'));
  const fb1 = await fsBtn();
  check('F9: màn chơi có nút #fullscreen ≥ 40×40px', !!fb1 && (await visible('#fullscreen')) && fb1.w >= 40 && fb1.h >= 40, fb1 ? `${Math.round(fb1.w)}×${Math.round(fb1.h)}px` : 'không có nút');

  // ---------------- F2 · tình huống
  check('F2: #prompt hiện đúng prompt của tình huống', (await text('#prompt')) === s.scenario.prompt, s.scenario.id);
  check('F2: canvas vẽ 14 (13 cầu thủ + đĩa)', s.drawn.players === 14, `${s.drawn.onScreen} trong khung, ${s.drawn.offScreen} ở mép`);
  // ---------------- F7 · la bàn endzone đích
  check('F7: #goal hiện trên màn chơi', await visible('#goal'));
  const goalText = await text('#goal');
  check('F7: #goal có chữ ENDZONE và đúng khoảng cách', goalText.includes('ENDZONE') && goalText.includes(`${s.goal.distance}m`), `${goalText.trim()} / state ${s.goal.distance}m`);
  const deg = await evaluate(`Number(document.getElementById('goal-arrow').dataset.deg)`);
  const wantDeg = Math.round((s.goal.bearing * 180) / Math.PI);
  check('F7: #goal-arrow data-deg = góc tới endzone', deg === wantDeg, `${deg}° (cần ${wantDeg}°)`);

  // ---------------- F8 · người kèm bạn chuyển động
  const m1 = (await S()).marker;
  await sleep(300);
  const s2 = await S();
  const m2 = s2.marker;
  check('F8: người kèm bạn hiện trong khung ở C1', !!m1 && !!m2);
  check('F8: người kèm bạn chuyển động (lệch ≥ 2px sau 300ms)', !!m1 && !!m2 && Math.abs(m1.sx - m2.sx) >= 2, m1 && m2 ? `${m1.sx.toFixed(1)} → ${m2.sx.toFixed(1)}px` : 'không thấy');
  check('F8: state().animating = true ở màn chơi', s2.animating === true);
  await shot('Tình huống 1 — nhìn bằng mắt cutter, người kèm bám sát');

  // ---------------- F5 · trước khi chạm
  check('F5: trước khi chạm, #minimap và #explain bị ẩn', !(await visible('#minimap')) && !(await visible('#explain')));

  // ---------------- F4 · chạm trời thì không tính
  await tap(f.w / 2, Math.max(4, s.horizonY - 30));
  await sleep(100);
  check('F4: chạm lên trời thì state().answered vẫn false', (await S()).answered === false);

  // ---------------- F4 · chạm đúng
  const before = Number(await text('#score'));
  await tapCorrect();
  const phaseAfterTap = (await S()).phase;
  const fx1 = await evaluate(`({ p: window.__game.state().fx.particles, c: [...document.querySelectorAll('.callout')].map((e) => e.textContent), sfx: (window.__sfx || []).slice() })`);
  await sleep(300);
  check('F13: chạm đúng → window.__sfx có "correct"', fx1.sfx.includes('correct'), fx1.sfx.slice(-4).join(', '));
  check('F13: chạm đúng → có hạt bắn (fx.particles > 0) ngay sau khi chạm', fx1.p > 0, `${fx1.p} hạt`);
  check('F13: chạm đúng lần đầu → chữ khen .callout "Hay!"', fx1.c.includes('Hay!'), JSON.stringify(fx1.c));
  check('F4: chạm vào vùng đúng → #feedback có chữ "Đúng"', (await text('#feedback')).includes('Đúng'), await text('#feedback'));
  check('F4: chạm đúng → #score tăng 1', Number(await text('#score')) === before + 1, `${before} → ${await text('#score')}`);
  check('F9: sân phủ cả cửa sổ mà chạm vào zoneScreen vẫn chấm "Đúng"', (await S()).correct === true);
  const pa1 = await lastEv('phase_answer');
  check('F11: chạm đúng → phase_answer outcome = correct, scenario_id = C1, phase = 1, decide_ms > 0',
    pa1?.params.outcome === 'correct' && pa1.params.scenario_id === 'C1' && pa1.params.phase === 1 && pa1.params.decide_ms > 0, JSON.stringify(pa1?.params));
  check('F8: chạm xong thì phase = run (bạn chạy tới đó)', phaseAfterTap === 'run', phaseAfterTap);
  await shot('Chạm đúng — đang chạy tới, đĩa đang bay');
  // F8 chờ chạy xong (như waitPhase) · F16 đo vệt đĩa, vòng đáp, độ cao máy quay trong lúc chờ
  let runMs = -1;
  let minH = 9;
  let trailMax = 0;
  let landing = false;
  const tRun = Date.now();
  while (Date.now() - tRun <= 2500) {
    const q = await S();
    minH = Math.min(minH, q.live?.camera?.h ?? 9);
    trailMax = Math.max(trailMax, q.fx?.trail ?? 0);
    landing = landing || !!q.fx?.landing;
    if (q.phase === 'done') { runMs = Date.now() - tRun; break; }
    await sleep(40);
  }
  check('F16: đĩa bay có vệt sáng (fx.trail ≥ 3) và vòng đáp (fx.landing)', trailMax >= 3 && landing, `trail=${trailMax}, landing=${landing}`);
  check('F16: chạy ≥ 6m → máy quay hạ thấp như lao người (camera.h < 1.4)', minH < 1.4, `thấp nhất ${minH.toFixed(2)}m`);
  s = await S();
  check('F8: chạy xong trong ≤ 2.5 giây (phase = done)', runMs >= 0, runMs >= 0 ? `${runMs + 300}ms` : 'hết giờ');
  check('F8: camera tới chỗ đã chạm (≤ 0.5m)', !!s.tap && gap(s.live.camera, s.tap) <= 0.5, s.tap ? `${gap(s.live.camera, s.tap).toFixed(2)}m` : 'không có tap');
  const cap1 = await text('#caption');
  check('F16: sau khi chạm đúng #caption hiện, có "Pha 1", "m" và "+"', (await visible('#caption')) && cap1.includes('Pha 1') && cap1.includes('m') && cap1.includes('+'), cap1);
  check('F8: chạm đúng → #feedback có chữ "Bắt được"', (await text('#feedback')).includes('Bắt được'), await text('#feedback'));
  await shot('Bắt được đĩa — hiện đáp án');

  // ---------------- F5 · sau khi chạm
  s = await S();
  check('F5: sau khi chạm, #minimap hiện', await visible('#minimap'));
  check('F5: #explain hiện đúng câu giải thích', (await visible('#explain')) && (await text('#explain')).includes(s.scenario.explain));
  const hn = await height('#next');
  check('F5: nút #next hiện, cao ≥ 44px', (await visible('#next')) && hn >= 44, `${Math.round(hn)}px`);
  const nb = await evaluate(`(() => ({ b: document.getElementById('next').getBoundingClientRect().bottom, ih: innerHeight, sy: scrollY }))()`);
  check('F9: nút #next nằm trọn trong cửa sổ, không cần cuộn (đáy ≤ innerHeight)', nb.b <= nb.ih && nb.sy === 0, `đáy ${Math.round(nb.b)} / ${nb.ih}, scrollY ${nb.sy}`);
  await shot('F9 · tấm đáy đáp án đè lên sân full màn hình');
  await click('#next');
  await sleep(250);
  s = await S();
  check('F5: bấm #next → state().index tăng lên 1', s.index === 1, `index=${s.index}`);
  const er = await lastEv('explanation_read');
  check('F11: bấm Tiếp sau đáp án → explanation_read có read_ms > 0', er?.params.read_ms > 0, JSON.stringify(er?.params));
  check('F5: bấm #next → #minimap ẩn lại', !(await visible('#minimap')));

  // ---------------- F4 · chạm sai
  await waitDecide();
  const before2 = Number(await text('#score'));
  await tapWrong();
  await sleep(300);
  const fx2 = await evaluate(`({ hb: document.querySelectorAll('.heart-break').length, sfx: (window.__sfx || []).slice(-6) })`);
  check('F16: chạm sai → #caption có "mất đĩa"', (await text('#caption')).includes('mất đĩa'), await text('#caption'));
  check('F13: chạm sai → window.__sfx có "wrong" và có tim vỡ .heart-break', fx2.sfx.includes('wrong') && fx2.hb > 0, `${fx2.hb} tim vỡ · ${fx2.sfx.join(', ')}`);
  check('F4: chạm xa vùng đúng → #feedback có chữ "Chưa đúng"', (await text('#feedback')).includes('Chưa đúng'), await text('#feedback'));
  check('F4: chạm sai → #score giữ nguyên', Number(await text('#score')) === before2);
  check('F10: chạm sai → #lives còn 2 ❤️', (await hearts()) === 2, await text('#lives'));
  check('F10: chạm sai → state().combo = 0', (await S()).combo === 0, `combo=${(await S()).combo}`);
  const pa2 = await lastEv('phase_answer');
  check('F11: chạm sai → phase_answer outcome = wrong', pa2?.params.outcome === 'wrong', JSON.stringify(pa2?.params));
  await shot('Chạm sai — mất 1 mạng, xem mũi tên chỉ chỗ đúng');

  // ---------------- F6 · chơi hết bài: 4 đúng 1 sai · F10 · combo ở 2 lần đúng liền (C3, C4)
  const gains = [];
  for (let i = 2; i < 5; i++) {
    await click('#next');
    await waitDecide();
    const p0 = Number(await text('#points'));
    await tapCorrect();
    await sleep(150);
    gains.push(Number(await text('#points')) - p0);
    if (i === 3) {
      check('F10: đúng 2 lần liền → state().combo = 2', (await S()).combo === 2, `combo=${(await S()).combo}`);
      check('F10: lần đúng thứ 2 liền được nhiều điểm hơn lần thứ nhất (combo)', gains[0] > 0 && gains[1] > gains[0], `+${gains[0]} rồi +${gains[1]}`);
      const co = await evaluate(`[...document.querySelectorAll('.callout')].map((e) => e.textContent)`);
      check('F13: đúng lần 2 liền → chữ khen .callout "Tuyệt!"', co.includes('Tuyệt!'), JSON.stringify(co));
      await shot('COMBO ×2 — điểm trận tăng nhanh hơn');
    }
  }
  await click('#next');
  await sleep(400);
  check('F6: hết 5 tình huống → #screen-result hiện', await visible('#screen-result'));
  check('F6: 4 đúng 1 sai → #final-score = 4/5', (await text('#final-score')) === '4/5', await text('#final-score'));
  check('F6: 4/5 → #verdict có chữ "Qua bài"', (await text('#verdict')).includes('Qua bài'), await text('#verdict'));
  const pe1 = await lastEv('point_end');
  check('F11: hết point 4/5 → point_end result = score, correct = 4', pe1?.params.result === 'score' && pe1.params.correct === 4, JSON.stringify(pe1?.params));
  check('F10: màn kết quả có #final-points và #best', (await visible('#final-points')) && (await visible('#best')), `${await text('#final-points')} · ${await text('#best')}`);
  check('F8: sang màn kết quả thì state().animating = false', (await S()).animating === false);
  await shot('Ghi điểm! Qua bài 4/5');
  await sleep(1800);
  const res = await evaluate(`({ on: document.querySelectorAll('#stars .star.on').length, fp: document.getElementById('final-points').textContent,
    want: window.__game.state().points.toLocaleString('vi-VN') + ' điểm' })`);
  check('F13: 4/5 → #stars có đúng 2 sao sáng', res.on === 2, `${res.on} sao`);
  check('F13: sau 2 giây #final-points chạy số xong = điểm trận cuối', res.fp === res.want, `${res.fp} / cần ${res.want}`);
  await shot('F13 · 2 sao, điểm chạy số xong');

  // ---------------- F6 + F10 · chơi lại vai Handler: hết stall rồi sai → turnover
  await click('#retry');
  await sleep(300);
  check('F6: bấm #retry → về #screen-start', await visible('#screen-start'));
  await click('#role-handler');
  await waitDecide();
  s = await S();
  const rc = await lastEv('retry_click');
  check('F11: bấm Chơi lại → retry_click', !!rc, JSON.stringify(rc?.params));
  const ps2 = await lastEv('point_start');
  check('F11: point_start lần sau có attempt = 2', ps2?.params.attempt === 2, JSON.stringify(ps2?.params));
  check('F7: tình huống H1 vẽ cổng endzone đích trên canvas', s.scenario.id === 'H1' && s.drawn.goal === true, `${s.scenario.id}, drawn.goal=${s.drawn.goal}`);
  await shot('Tình huống 1 — nhìn bằng mắt handler, thấy endzone đích');
  const lives0 = (await S()).lives;
  const t0 = Date.now();
  let hurry = null;
  while (!(await S()).answered && Date.now() - t0 <= 11000) {
    if (!hurry && (await S()).stall >= 8) {
      hurry = await evaluate(`({ cls: document.getElementById('stage').classList.contains('hurry'), tick: (window.__sfx || []).includes('tick') })`);
      await shot('F13 · 3 giây cuối stall — viền đỏ thở');
    }
    await sleep(200);
  }
  check('F13: stall ≥ 8 → #stage có class hurry và window.__sfx có "tick"', !!hurry && hurry.cls && hurry.tick, JSON.stringify(hurry));
  check('F10: không chạm tới hết đếm stall (≤ 11 giây) → #feedback có chữ "Stall"', (await text('#feedback')).includes('Stall'), `${await text('#feedback')} · ${Date.now() - t0}ms`);
  check('F10: hết stall → state().lives giảm 1', (await S()).lives === lives0 - 1, `${lives0} → ${(await S()).lives}`);
  check('F10: hết stall → nút #next hiện', await visible('#next'));
  const pa3 = await lastEv('phase_answer');
  check('F11: hết stall → phase_answer outcome = stall', pa3?.params.outcome === 'stall', JSON.stringify(pa3?.params));
  await shot('Stall 10 — mất đĩa');
  for (let k = 0; k < 2; k++) { // 3 mạng: hết stall + 2 lần chạm sai = 3 lần mất đĩa
    await click('#next');
    await waitDecide();
    await tapWrong();
    await sleep(300);
  }
  await click('#next');
  await sleep(400);
  check('F6: sai 3 lần → turnover, #screen-result hiện', await visible('#screen-result'));
  check('F6: turnover → #final-score = 0/5', (await text('#final-score')) === '0/5', await text('#final-score'));
  check('F6: turnover → #verdict có chữ "Chưa qua"', (await text('#verdict')).includes('Chưa qua'), await text('#verdict'));
  const pe2 = await lastEv('point_end');
  check('F11: turnover → point_end result = turnover, correct = 0', pe2?.params.result === 'turnover' && pe2.params.correct === 0, JSON.stringify(pe2?.params));
  await shot('Turnover — chưa qua 0/5');

  await click('#retry');
  await sleep(300);
  await click('#role-cutter');
  await sleep(300);
  s = await S();
  check('F6: chơi lại → score = 0 và index = 0', s.score === 0 && s.index === 0, `score=${s.score}, index=${s.index}`);

  // ---------------- F12 · về màn chính, rồi tập chơi 3 bước
  const hh = await evaluate(`(() => { const b = document.getElementById('home'); if (!b) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
  check('F12: màn chơi có nút #home ≥ 40px', !!hh && hh.w >= 40 && hh.h >= 40, hh ? `${Math.round(hh.w)}×${Math.round(hh.h)}` : 'không có nút');
  await click('#home');
  await sleep(300);
  check('F12: bấm #home → về #screen-start', await visible('#screen-start'));
  await click('#play');
  await sleep(350);
  s = await S();
  check('F12: bấm #play lần đầu → state().role = tutorial, index = 0', s.role === 'tutorial' && s.index === 0, `${s.role} ${s.index}`);
  const pr = await text('#prompt');
  check('F12: câu hỏi lúc tập ≤ 80 ký tự', pr.length > 0 && pr.length <= 80, `${pr.length}: ${pr}`);
  await waitDecide();
  await shot('F12 · Tập 1 — vòng sáng + bàn tay chỉ chỗ');
  await tapCorrect();
  await waitPhase('done', 2500);
  check('F12: tập 1 chạm vòng sáng → #feedback có "Bắt được"', (await text('#feedback')).includes('Bắt được'), await text('#feedback'));
  await click('#next');
  await sleep(250);
  await waitDecide();
  const lv = (await S()).lives;
  const decoy = ((await S()).ringsScreen || []).find((r) => r && !r.correct);
  if (decoy) await tap(decoy.x, decoy.y);
  await sleep(200);
  s = await S();
  check('F12: tập 2 chạm vòng có áo trắng → #feedback có "Thử lại", chưa trả lời, không mất mạng',
    !!decoy && (await text('#feedback')).includes('Thử lại') && s.answered === false && s.lives === lv,
    `${await text('#feedback')} · answered=${s.answered} · lives ${lv} → ${s.lives}`);
  await shot('F12 · Tập 2 — chạm chỗ có áo trắng: thử lại');
  await tapCorrect();
  await sleep(150);
  check('F12: tập 2 chạm vòng trống → đúng', (await S()).correct === true);
  await waitPhase('done', 2500);
  await click('#next');
  await sleep(250);
  await waitDecide();
  await shot('F12 · Tập 3 — tự tìm chỗ trống, có đồng hồ');
  await tapCorrect();
  await waitPhase('done', 2500);
  check('F12: tập 3 xong → nút #next có chữ "Vào trận"', (await text('#next')).includes('Vào trận'), (await text('#next')).trim());
  await shot('F12 · Xong phần tập');
  await click('#next');
  await sleep(350);
  s = await S();
  check('F12: bấm "Vào trận" → state().role = cutter, index = 0', s.role === 'cutter' && s.index === 0, `${s.role} ${s.index}`);
  check('F12: localStorage cdd-tutorial-done = 1', (await evaluate(`localStorage.getItem('cdd-tutorial-done')`)) === '1');
  const tsteps = (await events()).filter((e) => e.name === 'tutorial_step');
  check('F12: có 3 sự kiện tutorial_step, bước 2 có tries = 1', tsteps.length === 3 && tsteps[1].params.tries === 1, JSON.stringify(tsteps.map((e) => e.params)));
  check('F12: có sự kiện tutorial_done', !!(await lastEv('tutorial_done')));
  await click('#home');
  await sleep(300);
  check('F12: đã tập xong → #play không còn chữ "Chơi ngay", nút #how hiện', !(await text('#play')).includes('Chơi ngay') && (await visible('#how')),
    `"${(await text('#play')).trim()}"`);
  await shot('F12 · Màn mở đầu sau khi đã tập: Chơi + Cách chơi');
}
