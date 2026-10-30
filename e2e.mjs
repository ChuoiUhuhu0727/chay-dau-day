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
  // F9: chờ tới khi state().phase = want (tối đa ms). Trả về số ms đã chờ, hoặc -1 nếu hết giờ.
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
  await shot('Màn mở đầu kiểu logo CLB');

  const tClick = Date.now();
  await click('#role-cutter');
  await sleep(350);
  let s = await S();
  check('F3: bấm #role-cutter thì hiện #screen-play', await visible('#screen-play'));
  check('F3: state().role = cutter', s.role === 'cutter', s.role);

  // ---------------- F9 · vào pha bóng: bạn chạy vào, cả sân chạy
  check('F9: vừa chọn vai thì state().phase = intro', s.phase === 'intro', s.phase);
  await shot('Vào pha bóng — bạn và cả sân đang chạy');
  const c1 = s.live.camera;
  await tapCorrect();
  await sleep(300);
  s = await S();
  check('F9: chạm lúc đang vào pha thì không tính (answered vẫn false)', s.answered === false);
  check('F9: camera đang chạy (đổi chỗ ≥ 0.3m sau 300ms)', gap(c1, s.live.camera) >= 0.3, `${gap(c1, s.live.camera).toFixed(2)}m`);
  await waitDecide();
  const introMs = Date.now() - tClick;
  check('F9: trong ≤ 2.5 giây chuyển sang phase = decide', (await S()).phase === 'decide' && introMs <= 2500, `${introMs}ms`);
  const mA = (await S()).live.mates;
  await sleep(300);
  const mB = (await S()).live.mates;
  const moved = Math.max(...mA.map((p, i) => gap(p, mB[i])));
  check('F9: lúc chờ chạm, đồng đội vẫn di chuyển (lệch > 0 sau 300ms)', moved > 0.01, `${moved.toFixed(2)}m`);
  s = await S();

  // ---------------- F1 · sân góc nhìn thứ nhất
  const isCanvas = await evaluate(`document.getElementById('field')?.tagName === 'CANVAS'`);
  const f = await fieldSize();
  check('F1: #field là <canvas> và hiện trên màn chơi', isCanvas && (await visible('#field')));
  check('F1: #field rộng ≤ 390px', f.w <= 390, `${Math.round(f.w)}px`);
  check('F1: state().camera có x, y, heading', ['x', 'y', 'heading'].every((k) => typeof s.camera?.[k] === 'number'), JSON.stringify(s.camera));

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
  await sleep(300);
  check('F4: chạm vào vùng đúng → #feedback có chữ "Đúng"', (await text('#feedback')).includes('Đúng'), await text('#feedback'));
  check('F4: chạm đúng → #score tăng 1', Number(await text('#score')) === before + 1, `${before} → ${await text('#score')}`);
  check('F9: chạm xong thì phase = run (bạn chạy tới đó)', phaseAfterTap === 'run', phaseAfterTap);
  await shot('Chạm đúng — đang chạy tới, đĩa đang bay');
  const runMs = await waitPhase('done', 2500);
  s = await S();
  check('F9: chạy xong trong ≤ 2.5 giây (phase = done)', runMs >= 0, runMs >= 0 ? `${runMs + 300}ms` : 'hết giờ');
  check('F9: camera tới chỗ đã chạm (≤ 0.5m)', !!s.tap && gap(s.live.camera, s.tap) <= 0.5, s.tap ? `${gap(s.live.camera, s.tap).toFixed(2)}m` : 'không có tap');
  check('F9: chạm đúng → #feedback có chữ "Bắt được"', (await text('#feedback')).includes('Bắt được'), await text('#feedback'));
  await shot('Bắt được đĩa — hiện đáp án');

  // ---------------- F5 · sau khi chạm
  s = await S();
  check('F5: sau khi chạm, #minimap hiện', await visible('#minimap'));
  check('F5: #explain hiện đúng câu giải thích', (await visible('#explain')) && (await text('#explain')).includes(s.scenario.explain));
  const hn = await height('#next');
  check('F5: nút #next hiện, cao ≥ 44px', (await visible('#next')) && hn >= 44, `${Math.round(hn)}px`);
  await click('#next');
  await sleep(250);
  s = await S();
  check('F5: bấm #next → state().index tăng lên 1', s.index === 1, `index=${s.index}`);
  check('F5: bấm #next → #minimap ẩn lại', !(await visible('#minimap')));

  // ---------------- F4 · chạm sai
  await waitDecide();
  const before2 = Number(await text('#score'));
  await tapWrong();
  await sleep(300);
  check('F4: chạm xa vùng đúng → #feedback có chữ "Chưa đúng"', (await text('#feedback')).includes('Chưa đúng'), await text('#feedback'));
  check('F4: chạm sai → #score giữ nguyên', Number(await text('#score')) === before2);
  await shot('Chạm sai — xem mũi tên chỉ chỗ đúng');

  // ---------------- F6 · chơi hết bài: 4 đúng 1 sai
  for (let i = 2; i < 5; i++) {
    await click('#next');
    await waitDecide();
    await tapCorrect();
    await sleep(150);
  }
  await click('#next');
  await sleep(400);
  check('F6: hết 5 tình huống → #screen-result hiện', await visible('#screen-result'));
  check('F6: 4 đúng 1 sai → #final-score = 4/5', (await text('#final-score')) === '4/5', await text('#final-score'));
  check('F6: 4/5 → #verdict có chữ "Qua bài"', (await text('#verdict')).includes('Qua bài'), await text('#verdict'));
  check('F8: sang màn kết quả thì state().animating = false', (await S()).animating === false);
  await shot('Qua bài 4/5');

  // ---------------- F6 · chơi lại, sai cả 5 (vai Handler)
  await click('#retry');
  await sleep(300);
  check('F6: bấm #retry → về #screen-start', await visible('#screen-start'));
  await click('#role-handler');
  await waitDecide();
  s = await S();
  check('F7: tình huống H1 vẽ cổng endzone đích trên canvas', s.scenario.id === 'H1' && s.drawn.goal === true, `${s.scenario.id}, drawn.goal=${s.drawn.goal}`);
  await shot('Tình huống 1 — nhìn bằng mắt handler, thấy endzone đích');
  for (let i = 0; i < 5; i++) {
    await waitDecide();
    await tapWrong();
    await sleep(150);
    await click('#next');
    await sleep(200);
  }
  check('F6: sai cả 5 → #final-score = 0/5', (await text('#final-score')) === '0/5', await text('#final-score'));
  check('F6: 0/5 → #verdict có chữ "Chưa qua"', (await text('#verdict')).includes('Chưa qua'), await text('#verdict'));
  await shot('Chưa qua 0/5');

  await click('#retry');
  await sleep(300);
  await click('#role-cutter');
  await sleep(300);
  s = await S();
  check('F6: chơi lại → score = 0 và index = 0', s.score === 0 && s.index === 0, `score=${s.score}, index=${s.index}`);
}
