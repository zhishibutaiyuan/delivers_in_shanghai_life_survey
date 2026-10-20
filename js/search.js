// 搜索与筛选：给定点位、关键词和勾选的子类，返回匹配结果（带匹配分数）。
(function () {
  // 骑手的说法和数据里的用词不一定一样，比如搜“厕所”要能找到“卫生间”
  var SYNONYMS = {
    "厕所": ["卫生间", "公厕"],
    "洗手间": ["卫生间", "公厕"],
    "上厕所": ["卫生间", "公厕"],
    "喝水": ["饮水"],
    "热水": ["饮水"],
    "接水": ["饮水"],
    "电瓶": ["换电", "充电"],
    "换电池": ["换电"],
    "手机充电": ["充电"],
    "休息": ["歇脚", "驿站", "休息"],
    "歇脚": ["歇脚", "驿站", "休息"],
    "热饭": ["微波炉"],
    "进不去": ["禁入"],
    "不让进": ["禁入"],
    "禁行": ["禁入"],
    "电梯": ["步行", "电梯"],
    "走路": ["步行"],
    "停车": ["停车"],
    "危险": ["减速", "危险"],
    "事故": ["减速", "事故"],
    "找不到": ["难找", "入口"],
    "绕路": ["通行", "绕"],
    "下雨": ["积水", "雨"]
  };

  function norm(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, "");
  }

  // 预先拼好每个点位的可搜索文本，避免每次输入都重新拼
  function index(points, typeLabel) {
    points.forEach(function (p) {
      p._s = {
        name: norm(p.name),
        other: norm([p.address, (p.tags || []).join(" "), typeLabel(p), p.desc, p.facilities].join(" "))
      };
    });
  }

  // 关键词按空格拆开，每个词（或它的近义词）都要命中名称、地址、标签、类型、说明之一
  function score(p, terms) {
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var alts = [t].concat(SYNONYMS[t] || []);
      if (p._s.name.indexOf(t) === 0) { total += 3; continue; }
      if (p._s.name.indexOf(t) > -1) { total += 2; continue; }
      var hit = false;
      for (var j = 0; j < alts.length && !hit; j++) {
        hit = p._s.name.indexOf(alts[j]) > -1 || p._s.other.indexOf(alts[j]) > -1;
      }
      if (!hit) return 0;
      total += 1;
    }
    return total;
  }

  function filter(points, query, enabledSubtypes) {
    var terms = String(query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    var out = [];
    points.forEach(function (p) {
      if (!enabledSubtypes[p.subtype]) return;
      var s = terms.length ? score(p, terms) : 1;
      if (s > 0) out.push({ point: p, score: s });
    });
    return { items: out, hasQuery: terms.length > 0 };
  }

  window.RiderSearch = { index: index, filter: filter };
})();
