#!/usr/bin/env python3
"""金箍棒少女大战妖潮 20秒史诗视频 - 3段生成+拼接
基于用户分镜脚本：10镜头20秒，中文prompt
"""
import json, os, time, requests, urllib.request, urllib.error, ssl

cfg = json.loads(open(".config.json").read())
key = os.getenv("AGNES_API_KEY", "") or cfg.get("api_key", "")
BASE = "https://api.agnes-ai.cn/v1"
HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
_REF_URL = ("https://cos-platform-outputs.agnes-ai.cn/images/t2i/"
            "task_mxe3ZuIfifojnQmCdTtXg1xFx8r7aoRx/output_"
            "afb89633ae7e4e5e840a02f7e9579f30.png")

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE

# 统一角色描述前缀（每段都包含以保证一致性）
CHAR_PREFIX = (
    "A peerless female warrior wielding the Ruyi Jingu Bang golden cudgel, "
    "long flowing black hair with golden hairpins and red ribbons, golden forehead marking, "
    "fierce determined eyes, wearing ornate golden-red battle armor with intricate patterns, "
    "red flowing sash trailing behind, bare midriff showing toned abdomen, "
    "golden armbands and waist chains, standing in Eastern immortal gate sanctuary above sea of clouds. "
)

SEGS = [
    # 分段1：镜头1-2 (7s) 古殿跃下·贴湖疾掠 + 踏栏冲桥·四棒清桥
    {
        "name": "seg0_gudischarge_bridgeclear",
        "seconds": "7",
        "prompt": (
            CHAR_PREFIX +
            "Epic cinematic action sequence in Eastern immortal gate sanctuary above sea of clouds. "
            "The warrior leaps from mountain-top ancient pavilion, red sash and hair streaming behind her. "
            "She streaks low above the crystalline lake surface, the golden Ruyi Jingu Bang dragging "
            "a glowing golden-red water trail miles long. Spirit mist torn apart by staff wind. "
            "Low-angle water-level tracking shot, 35mm, rapid dolly forward, whip pan. "
            "She spins mid-charge, hips torque, shoulders drive — golden afterimages explode from the staff, "
            "red lotus flames缠绕. One horizontal sweep obliterates hundreds of snake-shaped water demons "
            "and flying fish spirits; they dissolve into墨色烟尘 and金红火光 instantly. Zero blood. "
            "She lands on fingertips, continues sprinting across water. "
            "TRANSITION: She kicks off a stone balustrade, it explodes into fragments. "
            "She streaks up the stone arch bridge, thousands of water demons charging. "
            "Four rapid strikes: horizontal sweep, diagonal chop, reverse spin, upward hook — "
            "bridge cleared in seconds. Flying fish spirits dive from clouds on both sides. "
            "She launches airborne, spins, and SLAMS the staff into the lake — "
            "giant golden-red flame impact wave erupts across the water surface. "
            "Hundred-meter wave walls shatter. Screen shakes. "
            "大招爆发特效: full-screen ink wash impact frame + 0.15s frame drop freeze + "
            "full-screen negative flash white + radial violent shake + center fisheye distortion + "
            "golden-red shockwave ring expanding. "
            "Tyndall beams pierce through clouds, golden rim light on ancient architecture. "
            "Cinematic 8K CG, PBR materials, dramatic lighting, Chinese mythology epic."
        ),
    },
    # 分段2：镜头3-5 (7s) 凌空转体焚天碾轮 + 高空俯拍折线冲杀 + 飞旋棒毁灭轨迹
    {
        "name": "seg1_airburnsky_heli俯瞰_spiralstaff",
        "seconds": "7",
        "prompt": (
            CHAR_PREFIX +
            "Continuing the battle sequence. The warrior leaps airborne, body twisting mid-flight. "
            "She swings the Ruyi Jingu Bang in a massive horizontal arc across the lake surface. "
            "Giant golden-red flame energy arc erupts — thick, saturated, with bright white core, "
            "pure golden fluid torrent inside, crimson lotus flames rolling along the outer edge, "
            "ink-wash style red-black diffusion radiating outward. Thousands of water demons annihilated "
            "in its path. Flying fish spirits burn into golden-red fire particles. "
            "The lake is carved into a百丈 glowing trench. She rides the energy wave, "
            "continuing to strike remaining demons. "
            "CAMERA: 18mm ultra-wide low angle tracking, slight slow-mo, then snap back to speed. "
            "TRANSITION: Camera pulls up to bird's-eye overhead view. "
            "She weaves through the lake, stone bridge, and mountain temples in a zigzag killing run. "
            "Each staff swing clears hundreds of demons. Flying fish spirits swarm from clouds. "
            "She backflips to dodge incoming attacks, counter-swings golden-red flame impact waves. "
            " Hundreds of demons shattered into墨色烟尘 and火属性 particles. "
            "CAMERA: 50mm to 200mm rapid push-in, then 14mm急速 pull-back, high-angle orbit. "
            "TRANSITION: The Ruyi Jingu Bang flies from her hand, spinning like a drill. "
            "It carves an S-shaped/Z-shaped/spiral毁灭轨迹 through the demon army. "
            "Golden-red energy storm环绕 the spinning staff. Nearby water demons instant-dissolve into墨烟. "
            "Water surface shows perfect physical reflections —湖面倒影与投影完全遵循物理规则. "
            "大招爆发: full-screen ink wash + 0.15s freeze + negative flash + radial shake + "
            "fisheye distortion + golden-red shockwave ring. "
            "Cinematic 8K CG, ultra-detailed, epic scale."
        ),
    },
    # 分段3：镜头6-10 (6s) 次元裂隙轰击 + 玄龟妖将 + 幽冥棒君 + 收尾
    {
        "name": "seg2_dimensionrift_turtle_yomi收尾",
        "seconds": "6",
        "prompt": (
            CHAR_PREFIX +
            "The warrior leaps high into the air, catching the spinning Ruyi Jingu Bang. "
            "She forms hand seals mid-air — dimensional rifts open above, spewing golden-red energy. "
            "Energy beams rain down, obliterating妖群. Water columns and fire waves erupt from the lake. "
            "Flying fish spirits shot out of the sky in golden rain. "
            "CAMERA: 35mm to 14mm,急速 up-tilt, back-view wide shot, satellite ultra-wide. "
            "TRANSITION: A mountain-sized玄龟妖将 rises from the lake bottom, "
            "ancient water-pattern shell, followed by hundred-meter dragon-spirit entourage. "
            "Thousands of water demons charge behind it,百丈巨浪 rising. "
            "She faces the onslaught head-on, dodges the dragon-spirit's sweeping attack, "
            "leaps onto the玄龟's back, drives the staff down — golden cracks spread across the shell "
            "like molten lava. "
            "She launches from the turtle's back into the sky, hand seals — "
            "pure golden and red lotus energy erupts around her. "
            "Gold thread and ink-wash clouds缠绕. "
            "大招爆发: full-screen ink wash + 0.15s freeze + negative flash + radial shake + "
            "fisheye + golden-red shockwave. "
            "TRANSITION: 幽冥棒君 — a giant energy avatar far larger than the palace temples, "
            "wielding an擎天巨棒, surrounded by golden-red flames and ink-wash clouds. "
            "It brings the staff down in one devastating strike — the million-demon army shatters. "
            "玄龟妖将, the lake, the entire army — obliterated in one blow. "
            "Final shot: golden-red light recedes. She lands gracefully on water, "
            "the Ruyi Jingu Bang spins back into her hand, golden-red embers fading. "
            "She stands amid恢复平静的湖面,倒影 restoring, ancient temples glowing in warm golden rim light. "
            "Snow-white stone lanterns,曲桥,苍劲古松, floating rocks andimmortal peaks in distance. "
            "Camera slowly crane-pulls to卫星级超广角, final freeze frame. "
            "Silent, majestic, epic conclusion. 8K CG, HDR, cinematic."
        ),
    },
]

OUT_DIR = "outputs/jingu_bang_video"
os.makedirs(OUT_DIR, exist_ok=True)

def post(url, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET",
        headers={"Authorization": HEADERS["Authorization"], "Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req, context=_ctx, timeout=300)
        return True, json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
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
for i, seg in enumerate(SEGS):
    dst = os.path.join(OUT_DIR, f"jingu_seg{i}.mp4")
    if os.path.exists(dst) and os.path.getsize(dst) > 50000:
        print(f"[skip] jingu_seg{i}.mp4")
        results.append(dst)
        continue

    print(f"\n{'='*60}")
    print(f"分段{i+1}/3: {seg['name']} ({seg['seconds']}s)")
    print(f"{'='*60}")
    print(f"Prompt preview: {seg['prompt'][:150]}...")

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
print(f"Generated {len(results)}/{len(SEGS)} segments")

# Write concat file
concat_path = os.path.join(OUT_DIR, "concat.txt")
with open(concat_path, "w") as f:
    for r in results:
        f.write(f"file '{os.path.basename(r)}'\n")
print(f"Concat file: {concat_path}")
