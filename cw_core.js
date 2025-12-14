/* ---------- Core analyzer (calculation unchanged; output bilingual) ---------- */
var cw_analyze = function (f, mod, index, nat) {
  var mx = Math.max, mi = Math.min;

  return function () {
    // Collect inputs at call time (traits are rendered later by buildTraits)
    var el = Array.prototype.slice.call(f.getElementsByTagName('input'));
    var
      status = ['', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      actual = status.slice(),
      l, i, j, radio = Array(24).fill(0), total = 0, a_total = 0;

    // Traits may not be rendered yet; fall back to neutral (middle) when missing.
    for (var t = 0; t < 24; t++) {
      var base = t * 3;
      var left = el[base];
      var mid = el[base + 1];
      var right = el[base + 2];
      if (left && left.checked) radio[t] = 1;
      else if (mid && mid.checked) radio[t] = 0;
      else if (right && right.checked) radio[t] = 2;
    }

    l = -1; while (++l < 27) {
      if (3 > l)
        i = index[l] + f[nat[l]].selectedIndex;
      else
        i = radio[l - 3] === 0 ? -1 : 18 + ((l - 3) * 2) + (radio[l - 3] === 1 ? 0 : 1);

      if (i !== -1) {
        status[0] += mod[i][0] + ' ';
        j = 0; while (++j < 13) if (mod[i][j]) status[j] += mod[i][j];
      }
    }

    actual[1] = status[1];
    l = 1; while (++l < 8)
      actual[l] = mx(1, mi(12, status[l])),
      total += status[l],
      a_total += actual[l];
    l = 7; while (++l < 13) actual[l] = mx(-4, mi(4, status[l] / 2 | 0));

    var lang = f['out_lang'] ? f['out_lang'].value : 'ja';
    var traitsJp = status[0].trim();
    var traitsList = traitsJp ? traitsJp.split(' ') : [];
    var sign = function(n){ return (n > 0 ? '+' : '') + n; };

    // --- Manual overrides (display only; calculation stays unchanged) ---
    var autoActual = actual.slice();
    applyManualOverrides(autoActual, actual);

    // Recompute adjusted total after overrides
    a_total = 0;
    var kk = 1;
    while(++kk < 8) a_total += actual[kk];

    // Stamina (HP) range for chart header
    var hpMin = (((actual[6] / 2 + 4) * 2 + (actual[7] / 2)) | 0);
    var hpMax = (((actual[6] / 2 + 4) * (actual[1] + 1) + (actual[7] / 2)) | 0);
    renderStamina(hpMin, hpMax);


    var traitEnMap = (typeof TRAIT_EN_MAP !== 'undefined') ? TRAIT_EN_MAP : {
      '秀麗':'Good-looking', '醜悪':'Ugly',
      '高貴の出':'Noble Birth', '下賎の出':'Humble Origin',
      '都会育ち':'City Raised', '田舎育ち':'Country Raised',
      '裕福':'Wealthy', '貧乏':'Poor',
      '厚き信仰':'Devout', '不心得者':'Irreligious', '不信得者':'Irreligious',
      '誠実':'Sincere', '不実':'Insincere',
      '冷静沈着':'Calm and Collected', '猪突猛進':'Rash',
      '貪欲':'Greedy', '無欲':'Content',
      '献身的':'Self-sacrificing', '利己的':'Selfish',
      '秩序派':'Lawful', '混沌派':'Chaotic',
      '進取派':'Progressive', '保守派':'Conservative',
      '神経質':'Neurotic', '鈍感':'Insensitive',
      '好奇心旺盛':'Curious', '無頓着':'Indifferent',
      '過激':'Radical', '穏健':'Moderate',
      '楽観的':'Optimistic', '悲観的':'Pessimistic',
      '勤勉':'Diligent', '遊び人':'Pleasure-seeker',
      '陽気':'Cheerful', '内気':'Shy',
      '派手':'Flashy', '地味':'Plain',
      '高慢':'Arrogant', '謙虚':'Humble',
      '上品':'Refined', '粗野':'Coarse',
      '武骨':'Blunt', '繊細':'Sensitive',
      '硬派':'Earnest', '軟派':'Flirtatious',
      'お人好し':'Good-natured', 'ひねくれ者':'Cynical',
      '名誉こそ命':'Lives for Honor', '愛に生きる':'Lives for Love'
    };

    if (lang === 'en') {
      var out = '';
      out += '- Stats:\n';
      out += '    Dexterity: ' + actual[2] + '\n';
      out += '    Agility: ' + actual[3] + '\n';
      out += '    Intelligence: ' + actual[4] + '\n';
      out += '    Strength: ' + actual[5] + '\n';
      out += '    Vitality: ' + actual[6] + '\n';
      out += '    Willpower: ' + actual[7] + '\n\n';

      out += '- Temperament:\n';
      out += '    Peaceful(-)↔Aggressive(+): ' + sign(actual[8]) + '\n';
      out += '    Introverted(-)↔Extroverted(+): ' + sign(actual[9]) + '\n';
      out += '    Cowardly(-)↔Brave(+): ' + sign(actual[10]) + '\n';
      out += '    Bold(-)↔Cautious(+): ' + sign(actual[11]) + '\n';
      out += '    Honest(-)↔Cunning(+): ' + sign(actual[12]) + '\n\n';

      out += '- Personality traits:\n';
      if (traitsList.length) {
        var traitsEnList = traitsList.map(function(jp){ return traitEnMap[jp] || jp; });
        out += '    ' + traitsEnList.join(' | ') + '\n';
      } else {
        out += '    \n';
      }
      f['output'].value = out;

    } else {
      f['output'].value =
        ' 体力 / レベル上限：' + ((actual[6] / 2 + 4) * 2 + actual[7] / 2 | 0) + '～' + ((actual[6] / 2 + 4) * (actual[1] + 1) + actual[7] / 2 | 0) + ' pt / L' + actual[1] + '\n' +
        '　　　　　　器用度：' + actual[2] + ' (' + status[2] + ') pt\n' +
        '　　　　　　敏捷度：' + actual[3] + ' (' + status[3] + ') pt\n' +
        '　　　　　　知　力：' + actual[4] + ' (' + status[4] + ') pt\n' +
        '　　　　　　筋　力：' + actual[5] + ' (' + status[5] + ') pt\n' +
        '　　　　　　生命力：' + actual[6] + ' (' + status[6] + ') pt\n' +
        '　　　　　　精神力：' + actual[7] + ' (' + status[7] + ') pt\n' +
        '　　　　能力値合計：' + a_total + ' (' + total + ') pt\n' +
        '　　　　　　好戦性：' + actual[8] + ' (' + (status[8] / 2) + ')\n' +
        '　　　　　　社交性：' + actual[9] + ' (' + (status[9] / 2) + ')\n' +
        '　　　　　　勇猛性：' + actual[10] + ' (' + (status[10] / 2) + ')\n' +
        '　　　　　　慎重性：' + actual[11] + ' (' + (status[11] / 2) + ')\n' +
        '　　　　　　狡猾性：' + actual[12] + ' (' + (status[12] / 2) + ')\n' +
        '　 回避力 / 抵抗力：' + (actual[3] + actual[11]) + ' / ' + (actual[7] + actual[10]) + '\n' +
        '　　　　　行動順位：' + (actual[3] - actual[11]) + '\n' +
        '混乱カードの適性値：' + (actual[4] - actual[12]) + '\n' +
        '　　　　自然治癒力：' + (actual[6] + actual[8]) + '\n' +
        '　　　選択クーポン：' + traitsJp;
    }

    // --- Charts update (visual only; calculation untouched) ---
    // Physical radar: baseline (autoActual) vs current (actual)
    var radarRaw = [autoActual[2], autoActual[3], autoActual[4], autoActual[5], autoActual[6], autoActual[7]];
    var radarAdj = [actual[2], actual[3], actual[4], actual[5], actual[6], actual[7]];
    var radarLabs = ['器用度','敏捷度','知力','筋力','生命力','精神力'];
    window.__lastRadarRaw = radarRaw;
    window.__lastRadarAdj = radarAdj;
    window.__lastRadarLabels = radarLabs;
    // Update inline labels + spinners + sum inside radar card
    updateRadarOverlay(autoActual, actual);
    var sumEl = document.getElementById('radarSum');
    if(sumEl) sumEl.textContent = '合計値: ' + a_total;

    // per-axis override flags (Dex..Will) for label coloring
    window.__lastRadarOverride = [
      !!(window.__overrideIdx && window.__overrideIdx[2]),
      !!(window.__overrideIdx && window.__overrideIdx[3]),
      !!(window.__overrideIdx && window.__overrideIdx[4]),
      !!(window.__overrideIdx && window.__overrideIdx[5]),
      !!(window.__overrideIdx && window.__overrideIdx[6]),
      !!(window.__overrideIdx && window.__overrideIdx[7])
    ];

    // Temperament bipolar: baseline (autoActual) vs current (actual)
    renderBipolarDual([
      { idx: 8,  l:'平和性', r:'好戦性', raw: autoActual[8],  adj: actual[8]  },
      { idx: 9,  l:'内向性', r:'外向性', raw: autoActual[9],  adj: actual[9]  },
      { idx: 10, l:'臆病性', r:'勇敢性', raw: autoActual[10], adj: actual[10] },
      { idx: 11, l:'大胆性', r:'慎重性', raw: autoActual[11], adj: actual[11] },
      { idx: 12, l:'正直性', r:'狡猾性', raw: autoActual[12], adj: actual[12] }
    ]);

    // Fit textarea height to content (leave room for viz)
    fitOutputArea();
    // Draw only the active panel (prevents hidden-canvas 0px issue)
    setTimeout(drawActiveViz, 0);

  };
}(document.getElementById('cwForm'), [
  ['標準型',    10, 6, 6, 6, 6, 6, 7,-1, 0, 0, 1, 0],
  ['万能型',    10, 7, 7, 6, 6, 6, 5, 0, 1, 0, 0, 0],
  ['勇将型',    10, 5, 6, 5, 8, 6, 6, 0, 0, 2, 0, 0],
  ['豪傑型',    10, 4, 5, 4, 9, 7, 5, 1, 0, 1,-1, 0],
  ['知将型',    10, 6, 6, 8, 5, 5, 6, 0, 0, 0, 1, 0],
  ['策士型',    10, 6, 5, 9, 4, 4, 6, 0, 0, 0, 1, 1],
  ['凡庸型',    12, 4, 4, 4, 4, 4, 4, 0, 0, 1, 1, 0],
  ['英明型',    10, 7, 7, 7, 7, 7, 7, 0, 1, 0, 1, 0],
  ['無双型',    10, 6, 7, 6, 9, 8, 6, 1, 0, 1, 0, 0],
  ['天才型',    10, 7, 6, 9, 6, 6, 8, 0, 0, 0, 1, 1],
  ['英雄型',    12, 7, 7, 8, 8, 7, 8, 0, 1, 1, 0,-1],
  ['神仙型',    15, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0],
  ['男／♂',     0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  ['女／♀',     0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  ['子供',       0, 1, 1, 0,-1,-1, 0, 0, 1, 0,-1, 0],
  ['若者',       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ['大人',       0, 0, 0, 0, 0,-1, 0,-1, 0, 0, 1, 0],
  ['老人',       0,-1,-1, 1,-1,-1, 1,-1, 0,-1, 1, 1],
  ['秀麗',       0, 0, 0, 0, 0,-1, 0, 0, 1, 0, 0, 0],
  ['醜悪',       0, 0, 0, 0, 0, 1, 0, 0,-1, 0, 0, 0],
  ['高貴の出',   0, 0, 0, 0, 0, 0, 0,-1, 0, 1, 0, 0],
  ['下賎の出',   0, 0, 0, 0, 0, 0, 0, 0, 0, 0,-1, 1],
  ['都会育ち',   0, 0, 0, 1, 0,-1, 0, 0, 1, 0, 0, 1],
  ['田舎育ち',   0, 0,-1, 0, 0, 1, 0, 0, 0, 0, 0,-1],
  ['裕福',       0, 0, 0, 0, 0, 0,-1,-1, 0, 0, 0,-1],
  ['貧乏',       0, 0, 0, 0, 0, 0, 1, 1, 0,-1, 0, 0],
  ['厚き信仰',   0, 0, 0,-1, 0, 0, 1, 0, 0, 1, 0,-1],
  ['不信得者',   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  ['誠実',       0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,-1],
  ['不実',       0, 0, 0, 0, 0, 0, 0, 0, 0,-1, 0, 1],
  ['冷静沈着',   0, 0,-1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
  ['猪突猛進',   0, 0, 1, 0, 0, 0,-1, 0, 0, 0,-1, 0],
  ['貪欲',       0, 0, 0, 0, 0, 1,-1, 1, 0,-1,-1, 0],
  ['無欲',       0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0, 0],
  ['献身的',     0, 0, 0, 0, 0,-1, 1,-1, 0, 0, 0, 0],
  ['利己的',     0,-1, 1, 0, 0, 0, 0, 1,-1, 0, 0, 1],
  ['秩序派',     0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,-1],
  ['混沌派',     0, 0, 0, 0, 1, 0,-1, 1, 0, 0, 0, 1],
  ['進取派',     0, 0, 1, 0, 0,-1, 0, 0, 0, 1,-1, 0],
  ['保守派',     0, 0, 0, 0,-1, 0, 1,-1, 0, 0, 1, 0],
  ['神経質',     0, 0, 1, 0,-1, 0, 0, 0,-1, 0, 1, 0],
  ['鈍感',       0, 0, 0,-1, 0, 1, 0, 0, 0, 0, 0, 0],
  ['好奇心旺盛', 0, 1, 0, 0, 0,-1, 0, 0, 0, 0, 0, 0],
  ['無頓着',     0, 0,-1, 0, 0, 0, 1, 0,-1, 0, 0, 0],
  ['過激',       0, 0, 0, 0, 1,-1, 0, 1, 0, 0,-1, 0],
  ['穏健',       0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 1, 0],
  ['楽観的',     0, 1,-1, 0, 0, 0, 0, 0, 0, 1,-1, 0],
  ['悲観的',     0, 0, 0, 1, 0, 0,-1, 0, 0,-1, 1, 0],
  ['勤勉',       0,-1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  ['遊び人',     0, 1, 0,-1, 0, 0, 0, 0, 1, 0, 0, 1],
  ['陽気',       0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  ['内気',       0, 0, 0, 0, 0, 0, 0, 0, 0,-1, 0, 0],
  ['派手',       0, 0, 1,-1, 0, 0, 0, 0, 1, 0,-1, 0],
  ['地味',       0, 0, 0, 0,-1, 1, 0, 0, 0,-1, 0, 0],
  ['高慢',       0,-1, 0, 0, 0, 0, 1, 1,-1, 0, 0, 0],
  ['謙虚',       0,-1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
  ['上品',       0, 0, 0, 1,-1, 0, 0,-1, 1, 0, 0, 0],
  ['粗野',       0, 0, 0,-1, 1, 0, 0, 1,-1, 0, 0, 0],
  ['武骨',       0,-1, 0, 0, 1, 0, 0, 0,-1, 1, 0, 0],
  ['繊細',       0, 1, 0, 0,-1, 0, 0, 0, 0,-1, 1, 0],
  ['硬派',       0, 0,-1, 0, 1, 0, 0, 0, 0, 1, 0,-1],
  ['軟派',       0, 1, 0, 0, 0, 0,-1, 0, 1,-1, 0, 0],
  ['お人好し',   0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,-1],
  ['ひねくれ者', 0, 0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0],
  ['名誉こそ命', 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,-1,-1],
  ['愛に生きる', 0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0, 0]
],
[0, 12, 14], ['n_type', 'n_sex', 'n_age']);
