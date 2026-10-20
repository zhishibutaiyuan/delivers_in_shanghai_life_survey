// 五角场骑手地图：地图、点位、筛选、搜索、详情、定位、坐标拾取。
(function () {
  var CFG = window.RIDER_MAP_CONFIG;
  var TAX = window.RIDER_MAP_TAXONOMY;
  var DATA = window.RIDER_MAP_DATA || { isSample: false, points: [] };
  var points = (DATA.points || []).slice();

  // ---------- 分类索引 ----------
  var categoryByKey = {};
  var subtypeByKey = {};
  TAX.categories.forEach(function (c) {
    categoryByKey[c.key] = c;
    c.subtypes.forEach(function (s) {
      subtypeByKey[s.key] = { key: s.key, label: s.label, icon: s.icon, hint: s.hint, category: c };
    });
  });
  function subtypeLabel(k) { return subtypeByKey[k] ? subtypeByKey[k].label : ""; }

  points = points.filter(function (p) { return subtypeByKey[p.subtype]; });
  RiderSearch.index(points, subtypeLabel);
  var pointById = {};
  points.forEach(function (p) { pointById[p.id] = p; });

  // ---------- 状态 ----------
  var state = {
    coord: "gcj",              // 当前底图坐标系
    enabled: {},               // 勾选的子类
    query: "",
    selectedId: null,
    user: null,                // 用户位置 { gcj: {lng, lat}, accuracy }
    pickMode: false
  };
  Object.keys(subtypeByKey).forEach(function (k) { state.enabled[k] = true; });

  // ---------- DOM ----------
  var $ = function (id) { return document.getElementById(id); };
  var panel = $("panel");
  var qInput = $("q");
  var mobileMQ = window.matchMedia("(max-width: 760px)");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch];
    });
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  // ---------- 坐标换算（数据统一为 GCJ-02） ----------
  function toDisplay(lng, lat) {
    if (state.coord === "wgs") {
      var w = Coord.gcjToWgs(lng, lat);
      return L.latLng(w.lat, w.lng);
    }
    return L.latLng(lat, lng);
  }
  function fromDisplay(latlng) {
    if (state.coord === "wgs") return Coord.wgsToGcj(latlng.lng, latlng.lat);
    return { lng: latlng.lng, lat: latlng.lat };
  }

  // ---------- 地图 ----------
  var map = L.map("map", {
    zoomControl: false,
    minZoom: CFG.minZoom,
    maxZoom: CFG.maxZoom,
    attributionControl: true
  }).setView(toDisplay(CFG.center.lng, CFG.center.lat), CFG.zoom);
  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: "topright", zoomInTitle: "放大", zoomOutTitle: "缩小" }).addTo(map);

  var baseDefs = CFG.baseLayers.slice();
  if (CFG.tiandituKey) {
    var tk = encodeURIComponent(CFG.tiandituKey);
    var tdt = function (layer) {
      return "https://t{s}.tianditu.gov.cn/" + layer + "_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + layer +
        "&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=" + tk;
    };
    baseDefs.push({
      name: "天地图", coord: "wgs", url: tdt("vec"), labelUrl: tdt("cva"),
      options: { subdomains: "01234567", maxNativeZoom: 18, attribution: "底图 &copy; 天地图" }
    });
  }

  var baseLayers = {};
  baseDefs.forEach(function (d) {
    var opts = Object.assign({ maxZoom: CFG.maxZoom }, d.options);
    var layer = L.tileLayer(d.url, opts);
    if (d.labelUrl) layer = L.layerGroup([layer, L.tileLayer(d.labelUrl, opts)]);
    layer._coord = d.coord;
    baseLayers[d.name] = layer;
  });
  var firstBase = baseLayers[baseDefs[0].name];
  firstBase.addTo(map);
  state.coord = firstBase._coord;
  L.control.layers(baseLayers, null, { position: "topright" }).addTo(map);

  // 切换底图时，如果坐标系变了，把视野中心和所有图形换算过去
  map.on("baselayerchange", function (e) {
    var next = e.layer._coord;
    if (next === state.coord) return;
    var centerGcj = fromDisplay(map.getCenter());
    var pickGcj = pickMarker ? fromDisplay(pickMarker.getLatLng()) : null;
    state.coord = next;
    map.setView(toDisplay(centerGcj.lng, centerGcj.lat), map.getZoom(), { animate: false });
    rebuildMarkers();
    drawUser();
    if (pickGcj) showPick(pickGcj);
  });

  // ---------- 点位图标 ----------
  function pinIcon(p, selected) {
    var st = subtypeByKey[p.subtype];
    return L.divIcon({
      className: "pin-wrap",
      html: '<div class="pin' + (selected ? " is-selected" : "") + '" style="--c:' + st.category.color + '"><span>' + st.icon + "</span></div>",
      iconSize: [34, 42],
      iconAnchor: [17, 40]
    });
  }

  var cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: CFG.clusterOffAtZoom,
    maxClusterRadius: 48,
    iconCreateFunction: function (c) {
      var kids = c.getAllChildMarkers();
      var rest = 0;
      kids.forEach(function (m) { if (m._point.category === "rest") rest++; });
      var pct = Math.round(rest / kids.length * 100);
      var g = categoryByKey.rest.color, o = categoryByKey.obstacle.color;
      return L.divIcon({
        className: "cluster-wrap",
        html: '<div class="cluster" style="background:conic-gradient(' + g + " 0 " + pct + "%, " + o + " " + pct + '% 100%)"><span>' + kids.length + "</span></div>",
        iconSize: [42, 42]
      });
    }
  });
  map.addLayer(cluster);

  var markerById = {};
  function rebuildMarkers() {
    cluster.clearLayers();
    markerById = {};
    points.forEach(function (p) {
      var m = L.marker(toDisplay(p.lng, p.lat), {
        icon: pinIcon(p, p.id === state.selectedId),
        title: p.name,
        keyboard: true,
        riseOnHover: true
      });
      m._point = p;
      m.on("click", function () { select(p.id, { fly: false }); });
      markerById[p.id] = m;
    });
    applyFilter();
  }

  // ---------- 筛选面板 ----------
  function counts() {
    var c = {};
    points.forEach(function (p) { c[p.subtype] = (c[p.subtype] || 0) + 1; });
    return c;
  }

  function renderFilters() {
    var c = counts();
    var html = "";
    TAX.categories.forEach(function (cat) {
      var total = 0;
      cat.subtypes.forEach(function (s) { total += c[s.key] || 0; });
      html += '<fieldset class="fgroup" style="--c:' + cat.color + '">' +
        '<legend><label><input type="checkbox" data-cat="' + cat.key + '"> <span class="dot"></span>' + esc(cat.label) +
        ' <span class="count">' + total + "</span></label></legend><div class=\"chips\">";
      cat.subtypes.forEach(function (s) {
        html += '<label class="chip" title="' + esc(s.hint) + '"><input type="checkbox" data-sub="' + s.key + '"><span>' +
          s.icon + " " + esc(s.label) + ' <em>' + (c[s.key] || 0) + "</em></span></label>";
      });
      html += "</div></fieldset>";
    });
    $("filter-groups").innerHTML = html;
    syncFilterInputs();
  }

  function syncFilterInputs() {
    var root = $("filter-groups");
    root.querySelectorAll("input[data-sub]").forEach(function (el) { el.checked = !!state.enabled[el.dataset.sub]; });
    TAX.categories.forEach(function (cat) {
      var on = cat.subtypes.filter(function (s) { return state.enabled[s.key]; }).length;
      var el = root.querySelector('input[data-cat="' + cat.key + '"]');
      el.checked = on === cat.subtypes.length;
      el.indeterminate = on > 0 && on < cat.subtypes.length;
    });
  }

  $("filter-groups").addEventListener("change", function (e) {
    var el = e.target;
    if (el.dataset.sub) state.enabled[el.dataset.sub] = el.checked;
    if (el.dataset.cat) categoryByKey[el.dataset.cat].subtypes.forEach(function (s) { state.enabled[s.key] = el.checked; });
    syncFilterInputs();
    applyFilter();
  });

  // ---------- 列表 ----------
  function fmtDist(m) {
    if (m < 1000) return "约 " + Math.max(10, Math.round(m / 10) * 10) + " 米";
    return "约 " + (m / 1000).toFixed(1) + " 公里";
  }
  function distTo(p) {
    if (!state.user) return null;
    return Coord.distance(state.user.gcj.lng, state.user.gcj.lat, p.lng, p.lat);
  }

  var currentList = [];
  function applyFilter() {
    var r = RiderSearch.filter(points, state.query, state.enabled);
    var items = r.items;
    items.forEach(function (it) { it.dist = distTo(it.point); });
    items.sort(function (a, b) {
      if (r.hasQuery && a.score !== b.score) return b.score - a.score;
      if (a.dist != null && b.dist != null) return a.dist - b.dist;
      return a.point.name.localeCompare(b.point.name, "zh-CN");
    });
    currentList = items;

    // 地图上只放匹配的点
    var visible = items.map(function (it) { return markerById[it.point.id]; }).filter(Boolean);
    cluster.clearLayers();
    cluster.addLayers(visible);

    var meta = points.length === 0
      ? "还没有点位数据。"
      : (r.hasQuery ? "找到 " + items.length + " 个点位" : "共 " + items.length + " 个点位") +
        (state.user ? " · 按距离排序" : "");
    $("result-meta").textContent = meta;

    var html = "";
    items.forEach(function (it) {
      var p = it.point, st = subtypeByKey[p.subtype];
      html += '<li><button type="button" class="item" data-id="' + esc(p.id) + '" style="--c:' + st.category.color + '">' +
        '<span class="item-icon">' + st.icon + "</span>" +
        '<span class="item-body"><span class="item-name">' + esc(p.name) + "</span>" +
        '<span class="item-sub">' + esc(st.label) + (p.address ? " · " + esc(p.address) : "") + "</span></span>" +
        (it.dist != null ? '<span class="item-dist">' + fmtDist(it.dist) + "</span>" : "") +
        "</button></li>";
    });
    if (!items.length && points.length) html = '<li class="empty">没有符合条件的点位，试试换个关键词或勾选更多类型。</li>';
    $("results").innerHTML = html;
  }

  $("results").addEventListener("click", function (e) {
    var b = e.target.closest(".item");
    if (b) select(b.dataset.id, { fly: true });
  });

  // ---------- 搜索 ----------
  var qTimer = null;
  qInput.addEventListener("input", function () {
    $("q-clear").hidden = !qInput.value;
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      state.query = qInput.value;
      if (state.selectedId) showList();
      applyFilter();
    }, 120);
  });
  qInput.addEventListener("focus", function () { setSheet("open"); });
  qInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && currentList.length) {
      qInput.blur();
      select(currentList[0].point.id, { fly: true });
    }
  });
  $("q-clear").addEventListener("click", function () {
    qInput.value = "";
    state.query = "";
    $("q-clear").hidden = true;
    applyFilter();
    qInput.focus();
  });

  // ---------- 详情 ----------
  var SOURCE_CLASS = { "实地走访": "src-field", "骑手指认": "src-rider", "实地走访+骑手指认": "src-both" };

  function navUrl(p) {
    return "https://uri.amap.com/marker?position=" + p.lng + "," + p.lat +
      "&name=" + encodeURIComponent(p.name) + "&coordinate=gaode&callnative=1";
  }

  function renderDetail(p) {
    var st = subtypeByKey[p.subtype];
    var d = distTo(p);
    var h = '<div class="d-type" style="--c:' + st.category.color + '"><span>' + st.icon + "</span>" +
      esc(st.category.label) + " · " + esc(st.label) + "</div>";
    h += "<h2>" + esc(p.name) + "</h2>";
    if (p.address) h += '<p class="d-addr">' + esc(p.address) + (d != null ? " · 距你" + fmtDist(d) : "") + "</p>";
    if (p.tags && p.tags.length) {
      h += '<div class="d-tags">' + p.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>";
    }
    if (p.desc) h += '<p class="d-desc">' + esc(p.desc) + "</p>";

    var rows = [];
    if (p.facilities) rows.push(["设施", p.facilities]);
    if (p.hours) rows.push(["开放时间", p.hours]);
    if (rows.length) {
      h += '<dl class="d-rows">' + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>";
    }
    if (p.quote) h += '<blockquote class="d-quote">“' + esc(p.quote.replace(/^[“"]|[”"]$/g, "")) + '”<cite>—— 受访骑手</cite></blockquote>';
    if (p.photos && p.photos.length) {
      h += '<div class="d-photos">' + p.photos.map(function (f) {
        var src = "photos/" + encodeURIComponent(f);
        return '<a href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="' + esc(p.name) + ' 现场照片" loading="lazy"></a>';
      }).join("") + "</div>";
    }
    h += '<a class="d-nav" href="' + navUrl(p) + '" target="_blank" rel="noopener">用高德地图导航到这里</a>';
    h += '<p class="d-source"><span class="src ' + (SOURCE_CLASS[p.source] || "") + '">' + esc(p.source || "来源未注明") + "</span>" +
      (p.date ? "采集于 " + esc(p.date) : "") + (p.collector ? " · " + esc(p.collector) : "") + "</p>";
    if (DATA.isSample) h += '<p class="d-sample">这是示例点位，不是真实地点。</p>';
    $("detail").innerHTML = h;
  }

  function setMarkerSelected(id, on) {
    var m = markerById[id];
    if (m) m.setIcon(pinIcon(m._point, on));
  }

  function select(id, opts) {
    var p = pointById[id];
    if (!p) return;
    if (state.selectedId && state.selectedId !== id) setMarkerSelected(state.selectedId, false);
    state.selectedId = id;
    setMarkerSelected(id, true);
    renderDetail(p);
    $("view-list").hidden = true;
    $("view-detail").hidden = false;
    panel.scrollTop = 0;
    setSheet("half");
    history.replaceState(null, "", "#p=" + encodeURIComponent(id));

    var m = markerById[id];
    if (!m) return;
    var target = m.getLatLng();
    if (opts && opts.fly) {
      var z = Math.max(map.getZoom(), CFG.clusterOffAtZoom);
      map.flyTo(offsetForSheet(target, z), z, { duration: 0.6 });
    } else if (mobileMQ.matches) {
      // 点击地图上的点位：只在它会被底部面板挡住时才平移
      var pt = map.latLngToContainerPoint(target);
      if (pt.y > map.getSize().y - sheetHeight() - 30) map.panTo(offsetForSheet(target, map.getZoom()));
    }
  }

  // 手机上底部面板（展开到一半时）的高度，与 style.css 中的 52vh 保持一致
  function sheetHeight() { return window.innerHeight * 0.52; }

  // 手机上底部面板会挡住下半屏，让点位落在可见区域中间
  function offsetForSheet(latlng, zoom) {
    if (!mobileMQ.matches) return latlng;
    var px = map.project(latlng, zoom);
    px.y += sheetHeight() / 2;
    return map.unproject(px, zoom);
  }

  function showList() {
    if (state.selectedId) setMarkerSelected(state.selectedId, false);
    state.selectedId = null;
    $("view-detail").hidden = true;
    $("view-list").hidden = false;
    history.replaceState(null, "", location.pathname + location.search);
  }
  $("detail-back").addEventListener("click", showList);

  // ---------- 手机底部面板 ----------
  function setSheet(s) {
    if (!mobileMQ.matches) return;
    panel.dataset.sheet = s;
  }
  $("sheet-handle").addEventListener("click", function () {
    setSheet(panel.dataset.sheet === "closed" ? "half" : (panel.dataset.sheet === "half" ? "open" : "closed"));
  });
  map.on("click", function () {
    if (!state.pickMode) setSheet("closed");
  });
  panel.dataset.sheet = "closed";

  // ---------- 地图按钮：定位 / 回五角场 / 拾取坐标 ----------
  var Buttons = L.Control.extend({
    options: { position: "topright" },
    onAdd: function () {
      var div = L.DomUtil.create("div", "leaflet-bar map-btns");
      div.innerHTML =
        '<a href="#" role="button" id="btn-locate" title="我的位置" aria-label="我的位置">' +
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" fill="none"/></svg></a>' +
        '<a href="#" role="button" id="btn-home" title="回到五角场" aria-label="回到五角场">' +
          '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg></a>' +
        '<a href="#" role="button" id="btn-pick" title="坐标拾取（调研组用）" aria-label="坐标拾取">' +
          '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="5" fill="none"/></svg></a>';
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });
  map.addControl(new Buttons());

  function onBtn(id, fn) {
    $(id).addEventListener("click", function (e) { e.preventDefault(); fn(); });
  }
  onBtn("btn-home", function () { map.flyTo(toDisplay(CFG.center.lng, CFG.center.lat), CFG.zoom, { duration: 0.6 }); });
  onBtn("btn-locate", function () { locate(true); });
  onBtn("btn-pick", function () { setPickMode(!state.pickMode); });

  // ---------- 定位 ----------
  var userLayer = L.layerGroup().addTo(map);
  function drawUser() {
    userLayer.clearLayers();
    if (!state.user) return;
    var ll = toDisplay(state.user.gcj.lng, state.user.gcj.lat);
    L.circle(ll, { radius: state.user.accuracy, className: "user-acc", interactive: false }).addTo(userLayer);
    L.circleMarker(ll, { radius: 8, className: "user-dot", interactive: false }).addTo(userLayer);
  }

  function getPosition(cb) {
    if (!navigator.geolocation) { toast("这个浏览器不支持定位"); return; }
    toast("正在定位…");
    navigator.geolocation.getCurrentPosition(function (pos) {
      var g = Coord.wgsToGcj(pos.coords.longitude, pos.coords.latitude);
      cb({ gcj: g, accuracy: Math.min(pos.coords.accuracy || 50, 500) });
    }, function (err) {
      toast(err.code === 1 ? "没有定位权限，请在浏览器设置里允许定位" : "定位失败，请稍后再试");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }

  function locate(fly) {
    getPosition(function (u) {
      state.user = u;
      drawUser();
      if (fly) map.flyTo(toDisplay(u.gcj.lng, u.gcj.lat), Math.max(map.getZoom(), 16), { duration: 0.6 });
      applyFilter();
      if (state.selectedId) renderDetail(pointById[state.selectedId]);
      $("btn-locate").classList.add("is-on");
      toast("已定位，列表按距离排序");
    });
  }

  // ---------- 坐标拾取（调研组采点用） ----------
  var pickMarker = null;
  function setPickMode(on) {
    state.pickMode = on;
    $("pick-bar").hidden = !on;
    document.body.classList.toggle("picking", on);
    $("btn-pick").classList.toggle("is-on", on);
    if (!on && pickMarker) { map.removeLayer(pickMarker); pickMarker = null; }
    if (on) { setSheet("closed"); toast("点击地图上的位置获取坐标"); }
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? "已复制" : "复制失败，请手动选中复制");
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast("已复制"); }, fallback);
    } else {
      fallback();
    }
  }

  function showPick(gcj) {
    var lng = gcj.lng.toFixed(6), lat = gcj.lat.toFixed(6);
    var ll = toDisplay(gcj.lng, gcj.lat);
    if (!pickMarker) pickMarker = L.marker(ll, { icon: L.divIcon({ className: "pick-pin", html: "<div></div>", iconSize: [24, 24] }) }).addTo(map);
    pickMarker.setLatLng(ll);
    var html = '<div class="pick-pop"><div>经度 <b>' + lng + "</b></div><div>纬度 <b>" + lat + "</b></div>" +
      '<button type="button" data-copy="' + lng + "\t" + lat + '">复制（可直接粘贴到 Excel 经度、纬度两列）</button>' +
      '<p>坐标系：GCJ-02（与高德一致）</p></div>';
    pickMarker.bindPopup(html, { closeButton: true, autoPan: true }).openPopup();
  }

  map.on("click", function (e) {
    if (state.pickMode) showPick(fromDisplay(e.latlng));
  });
  map.on("popupopen", function (e) {
    var b = e.popup.getElement().querySelector("[data-copy]");
    if (b) b.addEventListener("click", function () { copyText(b.dataset.copy); });
  });
  $("pick-here").addEventListener("click", function () {
    getPosition(function (u) {
      state.user = u;
      drawUser();
      map.setView(toDisplay(u.gcj.lng, u.gcj.lat), Math.max(map.getZoom(), 18));
      showPick(u.gcj);
      toast("定位精度约 " + Math.round(u.accuracy) + " 米，可拖动地图后点击修正");
    });
  });
  $("pick-exit").addEventListener("click", function () { setPickMode(false); });

  // ---------- 启动 ----------
  if (DATA.isSample) $("sample-banner").hidden = false;
  if (mobileMQ.matches) $("filters").open = false;
  renderFilters();
  rebuildMarkers();

  var m = location.hash.match(/^#p=(.+)$/);
  if (m && pointById[decodeURIComponent(m[1])]) select(decodeURIComponent(m[1]), { fly: true });
  if (/[?&]pick=1/.test(location.search)) setPickMode(true);
})();
