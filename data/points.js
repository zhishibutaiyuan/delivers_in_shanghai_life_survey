// 示例数据：点位全部是虚构的，只用来测试网页功能。
// 调研组交回点位表后，运行 python tools/build_data.py，本文件会被真实数据覆盖。
window.RIDER_MAP_DATA = {
  "isSample": true,
  "generatedAt": "2026-10-20",
  "points": [
    { "id": "sample-01", "name": "示例驿站 A", "category": "rest", "subtype": "station", "lng": 121.5172, "lat": 31.3021, "address": "示例地址 1 号", "desc": "示例：有饮水、充电、微波炉，可借雨具。", "tags": ["可饮水", "可充电", "微波炉", "雨具", "空调"], "facilities": "饮水机、充电插座、座椅、微波炉、应急药品", "hours": "9:00–21:00", "photos": [], "source": "实地走访", "collector": "示例", "date": "2026-10-20", "quote": "示例原话：累了就进来坐会儿。" },
    { "id": "sample-02", "name": "示例友好商户 B", "category": "rest", "subtype": "shop", "lng": 121.5118, "lat": 31.3004, "address": "示例地址 2 号", "desc": "示例：店家允许骑手进门接水、上厕所。", "tags": ["可饮水", "卫生间"], "facilities": "", "hours": "10:00–22:00", "photos": [], "source": "骑手指认", "collector": "示例", "date": "2026-10-20", "quote": "" },
    { "id": "sample-03", "name": "示例公共卫生间 C", "category": "rest", "subtype": "toilet", "lng": 121.5161, "lat": 31.2962, "address": "示例地址 3 号", "desc": "示例：免费公厕，电动车可以停在门口。", "tags": ["卫生间", "24小时"], "facilities": "", "hours": "全天", "photos": [], "source": "实地走访", "collector": "示例", "date": "2026-10-20", "quote": "" },
    { "id": "sample-04", "name": "示例换电柜 D", "category": "rest", "subtype": "charge", "lng": 121.5098, "lat": 31.2978, "address": "示例地址 4 号", "desc": "示例：换电柜，晚高峰前常需排队。", "tags": ["可充电", "早晚高峰"], "facilities": "", "hours": "全天", "photos": [], "source": "实地走访+骑手指认", "collector": "示例", "date": "2026-10-20", "quote": "" },
    { "id": "sample-05", "name": "示例休息点 E", "category": "rest", "subtype": "spot", "lng": 121.5196, "lat": 31.2995, "address": "示例路口东北角", "desc": "示例：树荫下的台阶，骑手常在这里等单。", "tags": [], "facilities": "", "hours": "", "photos": [], "source": "实地走访", "collector": "示例", "date": "2026-10-20", "quote": "示例原话：路边最自在。" },
    { "id": "sample-06", "name": "示例校门 F", "category": "obstacle", "subtype": "noentry", "lng": 121.5070, "lat": 31.3012, "address": "示例路 5 号", "desc": "示例：电动车不能进入，需要步行约 8 分钟送到楼下。", "tags": ["需登记"], "facilities": "", "hours": "", "photos": [], "source": "骑手指认", "collector": "示例", "date": "2026-10-20", "quote": "示例原话：系统只给三四分钟，进去肯定超时。" },
    { "id": "sample-07", "name": "示例商场 G", "category": "obstacle", "subtype": "walk", "lng": 121.5139, "lat": 31.3031, "address": "示例地址 6 号", "desc": "示例：餐饮在顶层，取餐要坐两段扶梯，高峰期电梯要等 5 分钟以上。", "tags": ["早晚高峰"], "facilities": "", "hours": "", "photos": [], "source": "实地走访+骑手指认", "collector": "示例", "date": "2026-10-20", "quote": "" },
    { "id": "sample-08", "name": "示例写字楼 H", "category": "obstacle", "subtype": "parking", "lng": 121.5185, "lat": 31.3048, "address": "示例地址 7 号", "desc": "示例：门口禁止停放电动车，最近的停车处在 200 米外。", "tags": [], "facilities": "", "hours": "", "photos": [], "source": "骑手指认", "collector": "示例", "date": "2026-10-20", "quote": "" },
    { "id": "sample-09", "name": "示例施工路段 I", "category": "obstacle", "subtype": "road", "lng": 121.5108, "lat": 31.2948, "address": "示例路东段", "desc": "示例：道路施工围挡，只能绕行。", "tags": ["雨天积水", "夜间昏暗"], "facilities": "", "hours": "", "photos": [], "source": "实地走访", "collector": "示例", "date": "2026-10-20", "quote": "" },
    { "id": "sample-10", "name": "示例路口 J", "category": "obstacle", "subtype": "crossing", "lng": 121.5150, "lat": 31.2995, "address": "示例路与示例路交叉口", "desc": "示例：右转车多，骑手反映要减速慢行。", "tags": ["早晚高峰"], "facilities": "", "hours": "", "photos": [], "source": "骑手指认", "collector": "示例", "date": "2026-10-20", "quote": "" },
    { "id": "sample-11", "name": "示例小区 K", "category": "obstacle", "subtype": "entrance", "lng": 121.5212, "lat": 31.3018, "address": "示例小区", "desc": "示例：导航定位在北门，实际只能从南门进。", "tags": [], "facilities": "", "hours": "", "photos": [], "source": "骑手指认", "collector": "示例", "date": "2026-10-20", "quote": "" }
  ]
};
