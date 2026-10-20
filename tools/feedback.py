"""读取并统计 docs/反馈问卷.md 中的答卷。

答卷文件格式（每份答卷一节）：
    ## 答卷 1 —— 专送骑手，跑了两年
    **1. 您是？**
    - [x] 外卖骑手（专送）
    **5. 哪个点不准？哪里不对？**
    > 政通路那个驿站8点就关了

单独运行可在终端查看统计：python tools/feedback.py
"""
import re
from collections import Counter, OrderedDict

from common import ROOT

FEEDBACK_MD = ROOT / "docs" / "反馈问卷.md"

# 题目未显示或未填写时的占位文字，不计入统计
_PLACEHOLDER = re.compile(r"^（.*(不显示|未填).*）$")


def load_responses(path=FEEDBACK_MD):
    """返回 (题目表, 答卷列表)。题目表：{题号: 题干}；答卷：{"title", "answers": {题号: {"choices", "text"}}}。"""
    if not path.exists():
        return OrderedDict(), []
    questions = OrderedDict()
    responses = []
    cur = None
    qnum = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        m = re.match(r"^##\s*答卷\s*\d+\s*[—\-]*\s*(.*)$", line)
        if m:
            cur = {"title": m.group(1).strip(), "answers": {}}
            responses.append(cur)
            qnum = None
            continue
        if cur is None:
            continue
        m = re.match(r"^\*\*(\d+)\.\s*(.+?)\*\*$", line)
        if m:
            qnum = int(m.group(1))
            questions.setdefault(qnum, m.group(2).strip())
            cur["answers"].setdefault(qnum, {"choices": [], "text": ""})
            continue
        if qnum is None:
            continue
        m = re.match(r"^-\s*\[[xX]\]\s*(.+)$", line)
        if m:
            cur["answers"][qnum]["choices"].append(m.group(1).strip())
            continue
        m = re.match(r"^>\s*(.*)$", line)
        if m:
            text = m.group(1).strip()
            if text and not _PLACEHOLDER.match(text):
                a = cur["answers"][qnum]
                a["text"] = (a["text"] + " " + text).strip()
    return questions, responses


def choice_label(choice):
    """“其他：送单没空看”统计时归为“其他”。"""
    return re.split(r"[：:]", choice, maxsplit=1)[0].strip()


def tally(questions, responses):
    """返回 {题号: (作答人数, Counter)}，只含选择题。"""
    out = OrderedDict()
    for q in questions:
        c = Counter()
        answered = 0
        for r in responses:
            a = r["answers"].get(q)
            if a and a["choices"]:
                answered += 1
                c.update(choice_label(x) for x in a["choices"])
        if answered:
            out[q] = (answered, c)
    return out


def texts(questions, responses):
    """返回 {题号: [(答卷标题, 文字), ...]}，只含有文字的题。"""
    out = OrderedDict()
    for q in questions:
        items = []
        for r in responses:
            a = r["answers"].get(q)
            if a and a["text"]:
                items.append((r["title"], a["text"]))
            elif a:
                items.extend((r["title"], x.split("：", 1)[1]) for x in a["choices"] if x.startswith("其他："))
        if items:
            out[q] = items
    return out


if __name__ == "__main__":
    qs, rs = load_responses()
    print(f"共 {len(rs)} 份答卷")
    for q, (n, c) in tally(qs, rs).items():
        print(f"\n{q}. {qs[q]}（{n} 人作答）")
        for k, v in c.most_common():
            print(f"   {k}：{v}")
    for q, items in texts(qs, rs).items():
        print(f"\n{q}. {qs[q]}")
        for title, t in items:
            print(f"   [{title}] {t}")
