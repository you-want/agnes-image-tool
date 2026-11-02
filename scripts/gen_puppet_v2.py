#!/usr/bin/env python3
"""傀师少女雪夜战斗视频 - 5段完整生成脚本（全中文prompt）"""
import json, os, time, requests, urllib.request, urllib.error, ssl

cfg = json.loads(open(".config.json").read())
key = os.getenv("AGNES_API_KEY", "") or cfg.get("api_key", "")
BASE = "https://api.agnes-ai.cn/v1"
HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
_REF_URL = ("https://cos-platform-outputs.agnes-ai.cn/images/t2i/"
            "task_sj8JwFEn8aSPpM0nVgzOdgdLERC7JVQr/output_"
            "1824e5556ea94aadaff09bf28361f419.png")

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE

SEGS = [
    # seg0 雪幕破场 (0-4s) - already done, skip
    # seg1 瞬闪丝斩 (4-8s) - already done, skip
    {
        "name": "03_凌空丝雨",
        "seconds": "4",
        "prompt": (
            "深冬雪夜，荒废古城，青石长街覆厚雪，断壁残垣挂冰棱。"
            "冷青月光与残灯暖橘交织。少女踏断墙跃起腾空，立于残塔之巅，无滞空拖沓。"
            "广角仰拍高空俯冲推拉镜头。她双臂舒展如献祭之姿，"
            "万千红线自指尖划出极致锐利大弧光，倾泻暴雨式锥形丝幕垂直轰炸下方敌群。"
            "雪地犁出纵横赤红光痕，雪花被丝线绞成漩涡冲天。"
            "高频屏幕震动感，打击感极强。"
            "她周身赤红丝线极致Bloom流光，银铃层叠反光，苗银耳冠冷冽。"
            "背景断壁残垣挂冰棱，冷青月光穿透云层，暖橘残灯在废墟中摇曳。"
            "快节奏不拖泥带水，电影级运镜，国漫巅峰CG战斗美学。"
        ),
    },
    {
        "name": "04_傀舞穿梭绝杀",
        "seconds": "4",
        "prompt": (
            "面部凄艳特写：少女唇角浅笑，丹凤眼迷离中透着肃杀，银流苏挂雪。"
            "以傀偶舞律动空翻闪避，无缝衔接超音速近身突刺，红线贯敌如穿纸。"
            "碎甲与冰晶齐飞，极致身法爆发——踏冰棱、凌空变向、雪巷瞬闪穿梭。"
            "全场只剩红线残影与漫天飞雪共舞，周身符纸绕身自燃成环。"
            "十指傀线骤然收拢，将敌方首领隔空锁成提线傀偶。"
            "踏碎残墙直冲高空，回身甩出红线绞成的巨型半月丝刃，正面撕裂整条雪街。"
            "赤红光爆震场，积雪被冲击波掀起成十米雪墙。"
            "360度高速环绕运镜，瞬切特写，凌厉零多余动作。"
            "发丝根根清晰，银饰细腻反光，高饱和赤红与纯白强烈撞色。"
        ),
    },
    {
        "name": "05_死寂收束",
        "seconds": "4",
        "prompt": (
            "雪落纷纷，少女孤身立于雪街中央，周身红线缓缓垂落如茧。"
            "被操纵的残敌傀偶垂首跪立雪中立成两列。"
            "她抬眸直视镜头，唇角浅笑，银流苏挂着一点未化的雪。"
            "镜头落地震镜后缓缓后拉定帧，远景留白。"
            "冷青月光洒落，暖橘残灯在远处废墟中明灭，大雪继续飘落。"
            "空灵阴柔氛围，雪夜死寂，哀婉死寂与杀伐凛冽并存。"
            "画面定格，电影级收尾，高动态范围，真实布料物理飘动，高精度雪花粒子。"
            "整体明亮空旷宁静，具有东方神话中的浪漫与神圣感。"
        ),
    },
]

OUT_DIR = "outputs/miao_puppet_v2"
os.makedirs(OUT_DIR, exist_ok=True)


def post(url, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET",
        headers={"Authorization": HEADERS["Authorization"], "Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req, context=_ctx, timeout=300)
        return True, json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        ct = e.headers.get_content_type() or ""
        try:
            return False, json.loads(e.read()), e.code
        except Exception:
            return False, e.read().decode(errors="replace"), e.code
    except Exception as e:
        return False, str(e), 0


def download(vid_url, dst):
    req = urllib.request.Request(vid_url, headers={"Authorization": HEADERS["Authorization"]})
    with open(dst, "wb") as f:
        with urllib.request.urlopen(req, context=_ctx, timeout=300) as r:
            while chunk := r.read(65536):
                f.write(chunk)


results = []
# Skip seg0 and seg1 (already done)
for i, seg in enumerate(SEGS):
    actual_i = i + 2  # seg0=0, seg1=1 already done
    dst = os.path.join(OUT_DIR, f"puppet_seg{actual_i}.mp4")
    if os.path.exists(dst) and os.path.getsize(dst) > 50000:
        print(f"[skip] puppet_seg{actual_i}.mp4")
        results.append(dst)
        continue

    print(f"\n{'='*60}")
    print(f"分镜{actual_i+1}: {seg['name']} ({seg['seconds']}s)")
    print(f"{'='*60}")
    print(f"Prompt: {seg['prompt'][:120]}...")

    body = {
        "model": "agnes-video-2.5-flash",
        "prompt": seg["prompt"],
        "mode": "reference",
        "size": "720P",
        "seconds": seg["seconds"],
        "aspect_ratio": "16:9",
        "images": [_REF_URL],
    }

    backoff = 30
    vid = None
    for attempt in range(8):
        ok, r, code = post(f"{BASE}/videos", body)
        if ok and "video_id" in r:
            vid = r["video_id"]
            print(f"  submitted video_id={vid}")
            break
        if code in (429, 503):
            print(f"  {code}, waiting {backoff}s...")
            time.sleep(backoff)
            backoff = min(backoff * 2, 300)
            continue
        print(f"  ERROR {code}: {str(r)[:300]}")
        break

    if not vid:
        print("  FAILED to submit")
        continue

    poll_backoff = 10
    video_url = None
    for stall in range(200):
        ok, r, code = post(f"{BASE}/agnesapi?video_id={vid}&model_name=agnes-video-2.5-flash")
        if code in (429, 503):
            time.sleep(poll_backoff)
            poll_backoff = min(poll_backoff * 2, 60)
            continue
        d = r.get("data", r) if isinstance(r, dict) else r
        status = d.get("status")
        if stall % 8 == 0:
            print(f"  poll: status={status} progress={d.get('progress')}")
        if status == "completed":
            video_url = d.get("url") or d.get("output", {}).get("url")
            break
        if status in ("failed", "error"):
            print(f"  VIDEO FAILED: {json.dumps(d, ensure_ascii=False)[:300]}")
            break
        time.sleep(15)

    if not video_url:
        print("  No video URL")
        continue

    download(video_url, dst)
    size_mb = os.path.getsize(dst) / 1048576
    print(f"  SAVED: {dst} ({size_mb:.1f}MB)")
    results.append(dst)

print(f"\n{'='*60}")
print(f"Generated {len(results)}/5 segments")

# Write concat file
concat_path = os.path.join(OUT_DIR, "concat.txt")
with open(concat_path, "w") as f:
    for r in results:
        f.write(f"file '{os.path.basename(r)}'\n")
print(f"Concat file: {concat_path}")
