"""tools/ 下各脚本共用的路径和读取函数。"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PHOTOS_DIR = ROOT / "photos"            # 网页使用的照片（已处理）
RAW_PHOTOS_DIR = DATA_DIR / "photos_raw"  # 调研组交来的原始照片（不上传仓库）
POINTS_XLSX = DATA_DIR / "points.xlsx"
POINTS_JS = DATA_DIR / "points.js"
TAXONOMY_JS = DATA_DIR / "taxonomy.js"

# 网页在线地址（GitHub Pages）。海报二维码和调研手册使用。
PAGES_URL = "https://zhishibutaiyuan.github.io/delivers_in_shanghai_life_survey/"
REPO_URL = "https://github.com/zhishibutaiyuan/delivers_in_shanghai_life_survey"

# 点位采集表的列，顺序即 Excel 中的列顺序
COLUMNS = [
    # (表头, 字段名, 是否必填, 说明)
    ("名称", "name", True, "简短好认，如“新心驿站”“复旦北区东门”"),
    ("大类", "category", True, "歇脚点 / 障碍点"),
    ("子类", "subtype", True, "从下拉框选，见“分类”工作表"),
    ("经度", "lng", True, "用网页坐标拾取获取，如 121.514500；也可先空着，只填地址，交给技术组补"),
    ("纬度", "lat", True, "如 31.299000"),
    ("地址", "address", True, "门牌号或路口，如“国和路 60 号”“政通路与国定路交叉口”"),
    ("说明", "desc", True, "一两句客观描述：这里有什么，或难在哪"),
    ("标签", "tags", False, "多个用顿号分隔，如“可饮水、可充电、卫生间”"),
    ("设施", "facilities", False, "歇脚点填：有哪些设施，是否好用"),
    ("开放时间", "hours", False, "歇脚点填，如“9:00–21:00”“全天”"),
    ("照片", "photos", False, "照片文件名，多张用顿号分隔；照片放进 data/photos_raw 文件夹"),
    ("来源", "source", True, "实地走访 / 骑手指认 / 实地走访+骑手指认 / 公开资料"),
    ("采集人", "collector", True, "队员姓名或缩写"),
    ("采集日期", "date", True, "如 2026-11-15"),
    ("骑手原话", "quote", False, "匿名，不写骑手姓名、手机号"),
    ("出处", "refs", False, "来源为“公开资料”时必填：网址，多个用空格分隔"),
    ("位置说明", "locNote", False, "坐标不是现场取的时写明怎么定的，如“按高德地图上××大厦的位置标定”"),
]

# 杨浦区大致范围（GCJ-02，略放宽），用来发现填错的坐标
YANGPU_BBOX = {"lng": (121.47, 121.60), "lat": (31.24, 31.36)}


def load_taxonomy():
    text = TAXONOMY_JS.read_text(encoding="utf-8")
    m = re.search(r"=\s*(\{.*\})\s*;?\s*$", text, re.S)
    if not m:
        raise SystemExit("无法解析 data/taxonomy.js：等号后面应为 JSON 对象")
    return json.loads(m.group(1))


def load_points():
    """读取 data/points.js，返回 (是否示例, 生成日期, 点位列表)。"""
    text = POINTS_JS.read_text(encoding="utf-8")
    m = re.search(r"=\s*(\{.*\})\s*;?\s*$", text, re.S)
    if not m:
        raise SystemExit("无法解析 data/points.js")
    data = json.loads(m.group(1))
    return data.get("isSample", False), data.get("generatedAt", ""), data.get("points", [])


def split_list(value):
    """把“a、b，c;d”这类单元格拆成列表。"""
    if value is None:
        return []
    parts = re.split(r"[、,，;；\n]+", str(value))
    return [p.strip() for p in parts if p.strip()]
