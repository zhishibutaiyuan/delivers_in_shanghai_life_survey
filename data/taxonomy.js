// 点位分类表：网页和 tools/ 下的脚本共用这一份。
// 修改分类只改这里，然后重新运行 tools/build_data.py 和 tools/make_template.py。
// 注意：等号后面必须是合法 JSON（双引号、无尾逗号），Python 脚本会直接解析它。
window.RIDER_MAP_TAXONOMY = {
  "categories": [
    {
      "key": "rest",
      "label": "歇脚点",
      "color": "#1f8a4c",
      "subtypes": [
        { "key": "station",  "label": "官方驿站",   "icon": "🏠", "hint": "街道、工会设立的骑手驿站、爱心驿站" },
        { "key": "shop",     "label": "友好商户",   "icon": "🏪", "hint": "允许骑手进门喝水、充电、上厕所的门店" },
        { "key": "toilet",   "label": "公共卫生间", "icon": "🚻", "hint": "免费公厕" },
        { "key": "charge",   "label": "充换电点",   "icon": "🔋", "hint": "电瓶换电柜、充电桩" },
        { "key": "spot",     "label": "自发休息点", "icon": "🌳", "hint": "骑手常聚集等单的树荫、台阶、广场角落" }
      ]
    },
    {
      "key": "obstacle",
      "label": "障碍点",
      "color": "#d2481f",
      "subtypes": [
        { "key": "noentry",  "label": "电动车禁入", "icon": "🚫", "hint": "校门、园区、小区不让电动车进，只能步行送" },
        { "key": "walk",     "label": "末端步行远", "icon": "🚶", "hint": "商场或写字楼取餐送餐要走很远，或电梯要等很久" },
        { "key": "parking",  "label": "停车困难",   "icon": "🅿️", "hint": "没有地方停电动车，或乱停会被罚" },
        { "key": "road",     "label": "通行困难",   "icon": "🚧", "hint": "施工、单行、绕路、路面差" },
        { "key": "crossing", "label": "需减速路口", "icon": "⚠️", "hint": "骑手反映事故多发、需要慢行的路口" },
        { "key": "entrance", "label": "难找入口",   "icon": "❓", "hint": "入口隐蔽、定位不准、楼号混乱" }
      ]
    }
  ],
  "sources": ["实地走访", "骑手指认", "实地走访+骑手指认"],
  "tags": ["可饮水", "可充电", "卫生间", "空调", "微波炉", "雨具", "24小时", "需登记", "早晚高峰", "雨天积水", "夜间昏暗"]
};
