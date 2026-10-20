// 搜索与筛选：给定点位、关键词和勾选的子类，返回匹配结果（带匹配分数）。
(function () {
  function norm(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, "");
  }

  // 预先拼好每个点位的可搜索文本，避免每次输入都重新拼
  function index(points, subtypeLabel) {
    points.forEach(function (p) {
      p._s = {
        name: norm(p.name),
        other: norm([p.address, (p.tags || []).join(" "), subtypeLabel(p.subtype), p.desc, p.facilities].join(" "))
      };
    });
  }

  // 关键词按空格拆开，每个词都要命中（名称、地址、标签、类型、说明之一）
  function score(p, terms) {
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (p._s.name.indexOf(t) === 0) total += 3;
      else if (p._s.name.indexOf(t) > -1) total += 2;
      else if (p._s.other.indexOf(t) > -1) total += 1;
      else return 0;
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
