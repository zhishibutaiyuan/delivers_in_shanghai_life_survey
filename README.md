# 五角场骑手地图

标出上海杨浦区五角场一带**外卖骑手能歇脚的地方**和**送餐容易卡住的地方**的网页地图。

- **歇脚点**：官方驿站、友好商户、公共卫生间、充换电点、骑手自发休息点
- **障碍点**：电动车禁入、末端步行远、停车困难、通行困难、需减速路口、难找入口

每个点位都来自队员实地走访或骑手当面指认，并注明来源、采集人和日期。点位分类借助 AI 整理，但点位本身没有一个是 AI 生成的。

> 复旦大学计算与智能创新学院 2026 年秋季日常化社会实践项目“技术向善——杨浦区外卖配送调研与信息地图实践”。

## 功能

- 地图缩放、拖动，一键回到五角场；缩小时相邻点位自动合并
- 按大类、子类筛选，显示每类数量
- 按名称、地址、标签搜索（如“充电”“卫生间”“禁入”），回车直接打开第一个结果
- 点位详情：说明、设施、开放时间、照片、骑手原话（匿名）、来源
- 我的位置：定位后列表按距离排序
- 一键跳转高德地图导航
- 坐标拾取：给调研组采点用，点地图或用当前位置，复制后可直接粘贴进 Excel
- 底图可切换：高德地图 / 高德卫星 / OpenStreetMap（可选天地图）
- 手机优先：底部可上拉面板，单手操作

## 打开方式

- **本地**：双击 `index.html` 即可（需要联网加载底图）。
- **在线**：开通 GitHub Pages 后访问 `https://<用户名>.github.io/<仓库名>/`。
- **调研组采点**：在网址后面加 `?pick=1`，打开后直接进入坐标拾取模式。

不需要安装 Node.js，也不需要编译。

## 更新点位数据

1. 调研组按 [`docs/点位采集表.xlsx`](docs/点位采集表.xlsx) 填表（里面有填写说明和分类表）。
2. 把填好的表保存为 `data/points.xlsx`，原始照片放进 `data/photos_raw/`（这个文件夹不会上传）。
3. 运行：

   ```bash
   pip install openpyxl pillow
   python tools/build_data.py
   ```

   脚本会检查必填项、分类、坐标范围、日期格式，以及是否误填了手机号；有问题会逐行列出，不会覆盖旧数据。照片会被摆正、缩小，并去掉 GPS 等拍摄信息后存进 `photos/`。

4. 刷新网页即可看到新数据。

## 修改分类或配置

| 想改什么 | 改哪个文件 |
|---|---|
| 分类、图标、颜色、常用标签 | `data/taxonomy.js`（改完重新运行 `tools/make_template.py` 生成新模板） |
| 地图中心、缩放级别、底图、反馈问卷链接、天地图 key | `js/config.js` |

## 目录结构

```
index.html            主页面
about.html            关于 / 图例 / 隐私说明
css/style.css         样式
js/config.js          配置
js/coord.js           WGS-84 ↔ GCJ-02 坐标换算
js/search.js          搜索与筛选
js/app.js             地图与交互
data/taxonomy.js      分类表（网页与脚本共用）
data/points.js        网页读取的点位数据（脚本生成）
photos/               处理后的照片
lib/                  Leaflet 1.9.4、Leaflet.markercluster 1.5.3（本地副本）
tools/                数据处理脚本、模板与手册生成
docs/                 点位采集表模板等
```

## 技术说明

- 原生 HTML/CSS/JavaScript + [Leaflet](https://leafletjs.com/)，无构建步骤；数据以 `.js` 文件加载，所以本地双击也能打开。
- 点位坐标统一使用 **GCJ-02**（与高德一致）。切换到 OpenStreetMap 等 WGS-84 底图时，网页自动换算。
- 默认底图使用高德瓦片，在国内加载快、细节丰富，但高德没有正式授权免 key 使用。如需完全合规，可在 [天地图](https://console.tianditu.gov.cn) 免费申请浏览器端 key，填入 `js/config.js` 的 `tiandituKey`。

## 隐私

网页和仓库不包含骑手姓名、正脸照片、手机号等个人信息。“我的位置”只在本机计算距离，不会上传。

## 许可

- 代码：[MIT](LICENSE)
- 点位数据与照片（`data/`、`photos/`）：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh-hans)
- 第三方库：Leaflet（BSD-2-Clause）、Leaflet.markercluster（MIT）
