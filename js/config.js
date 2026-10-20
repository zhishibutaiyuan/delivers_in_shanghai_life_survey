// 网页配置。日常维护一般只需要改这个文件。
window.RIDER_MAP_CONFIG = {
  // 五角场环岛（GCJ-02 坐标，与高德一致）
  center: { lng: 121.5145, lat: 31.2990 },
  zoom: 16,
  minZoom: 12,
  maxZoom: 19,

  // 缩放到这一级及以上时，不再把相邻点位合并成数字圆圈
  clusterOffAtZoom: 17,

  // 反馈问卷链接（腾讯问卷等）。留空则关于页显示“问卷待上线”。
  feedbackUrl: "",

  repoUrl: "https://github.com/zhishibutaiyuan/delivers_in_shanghai_life_survey",

  // 天地图 key：在 https://console.tianditu.gov.cn 免费申请“浏览器端”key 后填在这里，
  // 底图切换里就会多出“天地图”。留空则不显示。
  tiandituKey: "",

  // 底图。coord 表示该底图使用的坐标系：gcj = GCJ-02（高德），wgs = WGS-84（OSM、天地图）。
  // 点位数据统一按 GCJ-02 存储，切到 wgs 底图时网页会自动换算。
  baseLayers: [
    {
      name: "高德地图",
      coord: "gcj",
      url: "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      options: { subdomains: "1234", maxNativeZoom: 18, attribution: "底图 &copy; 高德地图" }
    },
    {
      name: "高德卫星",
      coord: "gcj",
      url: "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
      options: { subdomains: "1234", maxNativeZoom: 18, attribution: "影像 &copy; 高德地图" }
    },
    {
      name: "OpenStreetMap",
      coord: "wgs",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: { maxNativeZoom: 19, attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> 贡献者" }
    }
  ]
};
