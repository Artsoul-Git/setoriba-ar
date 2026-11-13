/* セトリバ（デモ）キャンプ場の立体模型を組み立てる。
   寸法の正は src_02/reserve.js の区画図（m＝入口から上流への距離、w＝土手のふもとから川への距離・単位はメートル）。
   区画図を直したら、ここの数字も合わせて直し、build.html で camp.glb / camp.usdz を作り直す。
   模型の縮尺：実際の 272m → 約 0.6m（机に置ける大きさ）。高さは見やすさのため実際の約4倍に強調。 */

export const SCALE = 1 / 450;      // 実寸 → 模型（メートル）
export const LIFT = 4;              // 建物・テントの高さの強調
export const CX = 136, CW = 20;     // 模型の中心（m, w）

// 実寸の (m, w, 高さ) → 模型の座標（x 右・y 上・z 手前）。川が奥、土手が手前
export function toModel(m, w, h = 0) {
  return [(m - CX) * SCALE, h * SCALE, -(w - CW) * SCALE];
}

// 説明会で押せる札（模型の上の点）
export const LABELS = [
  { id: 'hub', short: '① 入口', m: 8, w: 22, h: 10, name: '① 入口・ハブ', text: '入口でQRとナンバーを読み取り。ベースハウス・ゴミステーション・移動式トイレ①・炊事場・カヤック保管庫が集まる。ハブサイト（電源付き）6区画。' },
  { id: 'family', short: '②', m: 60, w: 30, h: 8, name: '② ファミリー', text: 'ファミリーサイト12区画（テント約8m×8m＋駐車スペース）。はじめての家族向け。BとCのあいだに車の通れる道。' },
  { id: 'harappa', short: '原っぱ', m: 38, w: 45, h: 6, name: 'みんなの原っぱ', text: 'ボール遊び・凧あげ・朝の体操。キャンプをしない人も無料で使える。井戸水のじゃぶじゃぶ噴水。' },
  { id: 'pond1', short: '池', m: 98, w: 43, h: 6, name: 'じゃぶじゃぶ池', text: 'ビオトープ①。川の水を入れず、底をさらって、はだしで水あそび。' },
  { id: 'fire', short: '③ 焚き火', m: 139, w: 41, h: 8, name: '③ あそび場・焚き火', text: '2つの池のあいだに焚き火ひろば（花火もここで）と木のあそび場（ハンモック）。区画から離して煙が届きにくい。' },
  { id: 'pond2', short: '池', m: 178, w: 41, h: 6, name: 'いきもの池', text: 'ビオトープ②。川の水が入る生き物の池。長靴を貸し出し、生き物さがし（釣りは禁止）。' },
  { id: 'solo', short: '④', m: 172, w: 12, h: 8, name: '④ ソロ', text: 'ソロのミニ区画5つ（1人用）。しずかなゾーン。' },
  { id: 'wide', short: '⑤', m: 232, w: 30, h: 8, name: '⑤ 川側ワイド・グループ', text: '川の見える川側ワイドサイト5区画と、2〜3家族で使えるグループサイト2区画。' },
  { id: 'kayak', short: '🛶', m: 6, w: 60, h: 6, name: 'カヤック乗り場', text: 'カヤック保管庫のすぐ上の川べり。ガイドと一緒に、流れのゆるやかな区間を約90分（仮）。' },
  { id: 'dote', short: '土手', m: 120, w: -14, h: 12, name: '土手の上の道', text: 'スタッフが朝・夕・夜に見回り。カメラ4台。増水時は入口の坂と非常用の坂から土手の上へ退避（移動式トイレも上げる）。' },
];

export function buildCamp(THREE) {
  const root = new THREE.Group();
  root.name = 'setoriba_camp';
  const g = new THREE.Group();          // 実寸で組んで最後に縮める
  g.scale.setScalar(SCALE);
  g.position.set(-CX * SCALE, 0, CW * SCALE);
  root.add(g);

  const mats = {};
  const mat = (hex, rough = 0.9) => mats[hex + rough] || (mats[hex + rough] = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 }));
  // 実寸の (m,w) を g の中の座標へ：x=m、z=-w
  const P = (m, w, y = 0) => new THREE.Vector3(m, y, -w);

  function flatShape(pts, y, thick, color) {
    const s = new THREE.Shape(pts.map(([m, w]) => new THREE.Vector2(m, w)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);            // (m,w) 平面を水平に。w は -z 方向へ
    const mesh = new THREE.Mesh(geo, mat(color));
    mesh.position.y = y;
    g.add(mesh); return mesh;
  }
  function slab(m1, m2, w1, w2, y, thick, color) {
    const geo = new THREE.BoxGeometry(m2 - m1, thick, w2 - w1);
    const mesh = new THREE.Mesh(geo, mat(color));
    mesh.position.copy(P((m1 + m2) / 2, (w1 + w2) / 2, y + thick / 2));
    g.add(mesh); return mesh;
  }
  function box(m, w, sx, sz, h, color, y = 0.9) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, h * LIFT, sz), mat(color));
    mesh.position.copy(P(m, w, y + h * LIFT / 2)); g.add(mesh); return mesh;
  }
  function roof(m, w, sx, sz, h, color, y) {
    const geo = new THREE.ConeGeometry(Math.max(sx, sz) * 0.75, h * LIFT, 4);
    geo.rotateY(Math.PI / 4); geo.scale(sx / Math.max(sx, sz), 1, sz / Math.max(sx, sz));
    const mesh = new THREE.Mesh(geo, mat(color));
    mesh.position.copy(P(m, w, y + h * LIFT / 2)); g.add(mesh); return mesh;
  }
  function ellipse(m, w, rx, rz, y, thick, color) {
    const geo = new THREE.CylinderGeometry(1, 1, thick, 40); geo.scale(rx, 1, rz);
    const mesh = new THREE.Mesh(geo, mat(color, 0.3));
    mesh.position.copy(P(m, w, y + thick / 2)); g.add(mesh); return mesh;
  }
  function tree(m, w, s = 1, y = 0.9) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.45 * s, 2 * s * LIFT * 0.5, 6), mat('#8a6a45'));
    trunk.position.copy(P(m, w, y + s * LIFT * 0.5)); g.add(trunk);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.2 * s, 4 * s * LIFT * 0.6, 7), mat('#4f8a3c'));
    top.position.copy(P(m, w, y + s * LIFT + 1.2 * s * LIFT * 0.6)); g.add(top);
  }
  function tent(m, w, size, color) {
    const geo = new THREE.ConeGeometry(size * 0.55, 1.6 * LIFT, 4); geo.rotateY(Math.PI / 4);
    const mesh = new THREE.Mesh(geo, mat(color, 0.7));
    mesh.position.copy(P(m, w, 0.9 + 0.8 * LIFT)); g.add(mesh);
  }
  function car(m, w, color, along = true) {
    box(m, w, along ? 2 : 4.4, along ? 4.4 : 2, 0.9, color, 0.95);
  }

  // 台座（模型の板）
  slab(-25, 297, -30, 88, -3, 3, '#7a5c3e');
  // 川
  slab(-25, 297, 40, 88, 0, 0.3, '#7FC4DD');
  // 河原
  flatShape([[-7, 63], [279, 48], [279, -2], [-7, -2]], 0.3, 0.3, '#C9DDA0');
  // キャンプ場の芝生（航空写真から起こした形）
  flatShape([[0, 0], [1, 57], [10, 60], [59, 56], [68, 40], [79, 28], [99, 25], [133, 34], [146, 33], [165, 28], [187, 28], [216, 45], [266, 47], [272, 0]], 0.6, 0.2, '#E3EFC2');
  // 土手（斜面）と上の道
  {
    const len = 322, h = 9;
    const geo = new THREE.BufferGeometry();
    const x0 = -25, x1 = x0 + len;
    const v = [x0, 0.6, 0, x1, 0.6, 0, x1, h, 18, x0, h, 18];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.setIndex([0, 2, 1, 0, 3, 2]); geo.computeVertexNormals();
    const s = new THREE.Mesh(geo, mat('#8DB04A')); s.material.side = THREE.DoubleSide; g.add(s);
    slab(-25, 297, -30, -18, -3, h + 3, '#8DB04A');
    slab(-25, 297, -26, -19, h, 0.4, '#E6D7B8');
  }
  // 入口の坂と非常用の坂（簡略）
  slab(-6, 2, -18, 2, 0.6, 1.2, '#D9C7A5');
  slab(266, 272, -18, 3, 0.6, 1.2, '#D9C7A5');
  // 場内の道（砂利）
  const road = '#E4DED0';
  slab(-2, 268, 3, 8, 0.8, 0.15, road);
  slab(14, 76, 19, 24, 0.8, 0.15, road); slab(14, 18, 7.5, 19.5, 0.8, 0.15, road); slab(72, 76, 7.5, 19.5, 0.8, 0.15, road);
  slab(200, 264, 20, 25, 0.8, 0.15, road); slab(200, 204, 7.5, 20.5, 0.8, 0.15, road); slab(260, 264, 7.5, 20.5, 0.8, 0.15, road);
  // ゾーンの面
  slab(19, 58, 37, 53, 0.8, 0.12, '#D3E8A4');              // みんなの原っぱ
  slab(130, 148, 23, 32, 0.8, 0.12, '#F2E2B0');            // 木のあそび場
  slab(129, 149, 36, 46, 0.8, 0.12, '#F6CDB8');            // 焚き火ひろば
  // 池（ビオトープ）
  ellipse(98, 43, 28, 8.5, 0.6, 0.45, '#8FD0E0');
  ellipse(178, 41, 25, 7.5, 0.6, 0.45, '#6FBCCB');
  // 噴水
  ellipse(23, 40.4, 1.8, 1.8, 0.8, 0.6, '#BFE6F2');

  // 区画（テント＋駐車スペース＋車）
  const TYPE_COLOR = { c: '#E8913A', b: '#F2CB45', s: '#3BA7A0', g: '#C8603A', a: '#3E8FB0' };
  const plots = [];
  const add = (t, m1, m2, w1, w2, pk, pd) => plots.push({ t, m1, m2, w1, w2, pk, pd });
  [18, 27, 36, 45, 54, 63].forEach(m => add('c', m, m + 8, 11, 19, 'd', 3));
  [18, 27, 36, 45, 54, 63].forEach(m => add('b', m, m + 8, 27, 35, 'd', 3));
  [79, 89, 99, 109, 119].forEach(m => add('b', m, m + 8, 11, 19, 'd', 3));
  [153, 163, 173, 183, 193].forEach(m => add('s', m, m + 6, 8.5, 15.5, 'l', 3));
  add('g', 208, 227, 8.5, 18.5, 'l', 3); add('g', 232, 251, 8.5, 18.5, 'l', 3);
  add('b', 252, 260, 11, 19, 'd', 3);
  [206, 217, 228, 239, 250].forEach(m => add('a', m, m + 10, 28, 38, 'd', 3));
  const carColors = ['#ffffff', '#c23b3b', '#3b5fc2', '#555555', '#e0e0e0', '#2f6b3e'];
  plots.forEach((p, i) => {
    slab(p.m1 + 0.3, p.m2 - 0.3, p.w1 + 0.3, p.w2 - 0.3, 0.8, 0.14, '#EEF5D8');
    const cm = (p.m1 + p.m2) / 2, cw = (p.w1 + p.w2) / 2, sz = Math.min(p.m2 - p.m1, p.w2 - p.w1);
    if (p.t === 'g') { tent(cm - 4, cw, 6, TYPE_COLOR.g); tent(cm + 4, cw, 6, '#E8A13A'); }
    else tent(cm, cw, Math.min(sz, 7), TYPE_COLOR[p.t]);
    if (p.pk === 'd') {
      slab(p.m1, p.m2, p.w1 - p.pd, p.w1, 0.8, 0.16, '#cfc8b8');
      if (i % 3 !== 1) car(cm, p.w1 - 1.5, carColors[i % carColors.length], false);
    } else {
      slab(p.m1 - p.pd, p.m1, p.w1, p.w2, 0.8, 0.16, '#cfc8b8');
      if (i % 3 !== 1) car(p.m1 - 1.5, cw, carColors[i % carColors.length], true);
    }
  });

  // 入口・ハブの建物
  box(7, 14.5, 12, 9, 2.2, '#FFF7DD'); roof(7, 14.5, 13, 10, 1.2, '#C8603A', 0.9 + 2.2 * LIFT);
  box(7, 24, 8, 8, 1.2, '#7FB069');                         // ゴミステーション
  box(4, 33, 6, 8, 1.6, '#ffffff'); box(11, 33, 6, 8, 0.4, '#d8d0c0', 0.9 + 1.4 * LIFT); // トイレ①・炊事の屋根
  [[9, 30.5], [13, 30.5], [9, 35.5], [13, 35.5]].forEach(([m, w]) => box(m, w, 0.4, 0.4, 1.4, '#8a6a45'));
  box(6, 49, 8, 8, 1.6, '#9CCBE0');                         // カヤック保管庫
  box(134, 14.5, 6, 9, 1.6, '#ffffff'); box(143, 14.5, 8, 9, 0.4, '#d8d0c0', 0.9 + 1.4 * LIFT); // トイレ②・炊事
  [[140, 11], [146, 11], [140, 18], [146, 18]].forEach(([m, w]) => box(m, w, 0.4, 0.4, 1.4, '#8a6a45'));

  // 焚き火（薪と火）
  { const f = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.4 * LIFT * 0.6, 6), mat('#F28C28', 0.5)); f.position.copy(P(139, 41, 0.9 + 0.7 * LIFT)); g.add(f);
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.6 * LIFT * 0.6, 6), mat('#FFD34D', 0.5)); f2.position.copy(P(139, 41, 0.9 + 0.6 * LIFT)); g.add(f2);
    [[-1, 0.4], [1, -0.4], [0, 1]].forEach(([a, b]) => box(139 + a, 41 + b, 2.6, 0.5, 0.3, '#6b4a2a')); }
  // 木のあそび場の木・ハンモック
  [[131, 25], [137, 30], [144, 25], [147, 30], [134, 31]].forEach(([m, w]) => tree(m, w, 0.9));
  // 河原と土手のふもとの木
  [[-4, 45], [70, 52], [120, 40], [158, 30], [200, 40], [270, 45], [-5, 5], [90, 2], [150, 3], [230, 2], [276, 20]].forEach(([m, w], i) => tree(m, w, 0.8 + (i % 3) * 0.15));
  // 土手の上の見回りカメラ（柱）
  [30, 100, 170, 240].forEach(m => { box(m, -20, 0.5, 0.5, 2, '#555555', 9); box(m, -20.6, 1.2, 1.2, 0.3, '#ffffff', 9 + 2 * LIFT); });
  // カヤック（川の上）
  [[4, 66, '#E8913A'], [14, 70, '#F2CB45'], [24, 66, '#C8603A']].forEach(([m, w, c]) => {
    const k = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 4.5, 4, 8), mat(c, 0.6)); k.rotation.z = Math.PI / 2; k.position.copy(P(m, w, 0.9)); g.add(k);
  });

  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return root;
}
