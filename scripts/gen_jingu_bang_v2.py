#!/usr/bin/env python3
"""金箍棒少女大战妖潮 - 5段×4秒 = 20秒精确还原版
将10镜头合并为5段，每段覆盖2个镜头，完整保留运镜/特效描述。
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

CHAR_SCENE = (
    "A peerless female warrior in ornate golden-red battle armor wielding the Ruyi Jingu Bang golden cudgel, "
    "long flowing black hair with golden hairpins and red ribbons, golden forehead marking, fierce determined eyes. "
    "Eastern immortal gate sanctuary above sea of clouds: layered flying-eave ancient pavilions, "
    "stone arch bridge over crystalline lake, ancient stone lanterns, twisted ancient pines. "
    "Morning golden sunlight pierces clouds creating giant Tyndall beams, "
    "warm golden rim light outlines ancient architecture, lake reflects pavilions and bridge shadows, "
    "spirit fog flows slowly on lake surface, distant floating rocks and immortal peaks. "
    "UE5 8K CG, PBR materials, cinematic lighting, Chinese mythology epic aesthetic."
)

SEGS = [
    # ── 分段1：镜头1-2（0-4s）古殿跃下·贴湖疾掠 + 踏栏冲桥·四棒清桥·砸水爆冲 ──
    {
        "name": "seg01_gudischarge_bridgeclear",
        "seconds": "4",
        "prompt": CHAR_SCENE + (
            "[SHOT 1-2] The warrior leaps from a mountain-top ancient pavilion, red sash and hair streaming. "
            "She streaks low above the crystalline lake, golden Ruyi Jingu Bang拖出数里发光金红水痕. "
            "Spirit mist torn apart. CAMERA: 35mm->18mm, low-angle water-level tracking, whip pan, slight slow-mo snap back. "
            "She spins mid-charge — golden afterimages explode, red lotus flames缠绕. "
            "One horizontal sweep obliterates hundreds of snake-shaped水妖 and flying fish妖精; "
            "they dissolve into墨色烟尘 and金红火光. Zero blood. "
            "She kicks off a stone balustrade — it爆炸碎成石块. "
            "Streaks up the stone arch bridge as thousands of water demons charge. "
            "Four rapid strikes:横抡, 斜劈, 反扫, 旋击 — bridge cleared instantly. "
            "Flying fish妖精 dive from clouds. She launches airborne, SLAMS the staff into the lake — "
            "giant golden-red flame impact wave erupts. Hundred-meter水墙崩裂. "
            "大招爆发: full-screen ink wash impact frame + 0.15s frame drop freeze + "
            "full-screen negative flash white + radial violent shake + center fisheye distortion + "
            "golden-red shockwave ring expanding. "
            "CAMERA: 24mm->14mm,高速跟拍贴地仰拍螺旋环绕, time ramp骤降后回弹. "
            "石栏炸裂碎石,百重水墙崩裂,湖面倒影撕裂成万千破碎光斑. "
            "Fast dynamic action, particles, splash spray, cinematic."
        ),
    },
    # ── 分段2：镜头3-4（4-8s）凌空转体焚天碾轮 + 高空俯拍折线冲杀 ──
    {
        "name": "seg02_airburnsky_heli",
        "seconds": "4",
        "prompt": CHAR_SCENE + (
            "[SHOT 3-4] She leaps airborne, body twisting mid-flight. "
            "Swings the Ruyi Jingu Bang in a massive horizontal arc across the lake. "
            "Giant golden-red flame energy arc erupts — bright white core, pure golden fluid torrent inside, "
            "crimson lotus flames rolling outer edge, ink-wash red-black diffusion. "
            "Thousands of water demons annihilated. Flying fishspirits burn to golden-red fire. "
            "Lake carved into百丈 glowing trench. "
            "大招爆发: 全屏水墨冲击帧+0.15s抽帧定格+全屏负片闪白+径向震动+中心鱼眼畸变+环形金红冲击波扩散. "
            "CAMERA: 18mm->14mm, low-angle water-level tracking, slight slow-mo. "
            "TRANSITION: Camera pulls up to bird's-eye overhead view. "
            "She weaves through lake, stone bridge, mountain temples in azigzag killing run. "
            "Each staff swing clears hundreds of demons. Backflips to dodge, counter-swings golden-red flame waves. "
            "Hundreds of demons shattered into墨色烟尘 and火属性 particles. "
            "One massive swing creates宏大金光轨obliterating半空数百妖群. "
            "CAMERA: 50mm->200mm rapid push-in, then 14mm急速 pull-back, high-angle orbit. "
            "Golden energy, crimson flame waves, and lake reflections interplay. "
            "Tyndall beams pierce clouds, golden rim light on ancient architecture."
        ),
    },
    # ── 分段3：镜头5-6（8-12s）金箍棒飞旋S/Z轨迹 + 腾空接棒次元裂隙轰击 ──
    {
        "name": "seg03_spiralstaff_dimension",
        "seconds": "4",
        "prompt": CHAR_SCENE + (
            "[SHOT 5-6] The Ruyi Jingu Bang flies from her hand, spinning like a drill. "
            "It carves an S-shaped/Z-shaped/spiral毁灭trajectory through the demon army. "
            "Golden-red energy storm环绕 the spinning staff. Nearby水妖 instant-dissolve into墨烟. "
            "Water surface shows perfect physical reflections —湖面倒影与投影完全遵循物理规则. "
            "She chases after it, striking remaining demons. "
            "大招爆发: 全屏水墨冲击帧+0.15s抽帧定格+全屏负片闪白+径向震动+中心鱼眼畸变+环形金红冲击波扩散. "
            "CAMERA: 24mm->18mm,定焦转变焦,高速跟拍>螺旋环绕贴水追拍, time ramp骤降后回弹. "
            "TRANSITION: She leaps high into the air, catching the spinning staff. "
            "Forms hand seals mid-air — dimensional rifts open above, spewing golden-red energy. "
            "Energy beams rain down, obliterating妖群. Water columns and fire waves erupt from the lake. "
            "Flying fishspirits shot out of the sky in golden rain. "
            "大招爆发 again: 全屏水墨冲击帧+0.15s抽帧定格+全屏负片闪白+径向震动+中心鱼眼畸变+环形金红冲击波扩散. "
            "CAMERA: 35mm->14mm,急速 up-tilt, back-view wide shot, satellite超广角. "
            "湖面掀起数十丈水柱与冲天火浪,云海被金红火光照亮."
        ),
    },
    # ── 分段4：镜头7-8（12-16s）玄龟妖将浮出·跃上龟背 + 幽冥棒君降临 ──
    {
        "name": "seg04_turtle_yomi",
        "seconds": "4",
        "prompt": CHAR_SCENE + (
            "[SHOT 7-8] A mountain-sized玄龟妖将 rises from the lake bottom — "
            "ancient water-pattern shell, followed by hundred-meter dragon-spirit entourage. "
            "Thousands of水妖 charge behind it,百丈巨浪 rising. "
            "She faces the onslaught head-on, dodges the dragon-spirit's sweeping attack, "
            "leaps onto the玄龟's back, drives the staff down — golden cracks spread like molten lava. "
            "水墨放射冲击帧+0.1s抽帧+中心负片+镜头猛沉+三层泼墨爆炸. "
            "CAMERA: 18mm->85mm,低角度仰拍玄龟浮出快速推拉越肩, time ramp骤降后回弹. "
            "TRANSITION: She launches from the turtle's back into the sky. "
            "Forms hand seals — pure golden and red lotus energy erupts. Gold thread and ink-wash clouds缠绕. "
            "大招爆发: 全屏水墨冲击帧+0.15s抽帧定格+全屏负片闪白+径向震动+中心鱼眼畸变+环形金红冲击波扩散. "
            "CAMERA: 85mm->14mm doll zoom,镜头猛沉>0.2s慢动作>猛甩回弹>鱼眼畸变. "
            "The巨大幽冥棒君法相 appears — far larger than palace temples, "
            "wielding an擎天巨棒, surrounded by golden-red flames and ink-wash clouds. "
            "龟甲百道金红裂纹灼亮,湖面巨浪翻涌,云海被幽冥棒君能量照亮."
        ),
    },
    # ── 分段5：镜头9-10（16-20s）幽冥棒君一棒轰落 + 收尾定格·仙门恢复 ──
    {
        "name": "seg05_finalstrike_ending",
        "seconds": "4",
        "prompt": CHAR_SCENE + (
            "[SHOT 9-10] The幽冥棒君's strike hits — the entire百万妖军, the玄龟妖将, "
            "the lake surface — ALL obliterated in one blow. "
            "Explosion of golden-red light and ink-wash particles. "
            "湖面倒影破碎成万千光斑. "
            "大招爆发: 全屏水墨冲击帧+0.15s抽帧定格+全屏负片闪白+径向剧烈震动+中心鱼眼畸变+环形金红冲击波扩散. "
            "CAMERA: 85mm->14mm,镜头猛沉>0.2s慢动作>猛甩回弹>鱼眼畸变, time ramp骤降后回弹. "
            "TRANSITION: Golden-red light recedes. She lands gracefully on water, "
            "the Ruyi Jingu Bang spins back into her hand, golden-red embers fading. "
            "She stands amid thecalming lake, reflections restoring, "
            "ancient temples glowing in warm golden rim light. "
            "Stone lanterns, curved bridges, ancient pines, floating rocks, immortal peaks. "
            "CAMERA: 50mm->18mm, CRANE升降拉升 to卫星超广角, final freeze frame. "
            "Time ramp轻微降速. 金红火星与墨色烟尘缓缓飘落形成前景遮挡,最终定格转场. "
            "Silent, majestic, epic conclusion. Clean frame, no text, no watermark."
        ),
    },
]

OUT_DIR = "outputs/jingu_bang_v2"
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
    print(f"分段{i+1}/5: {seg['name']} ({seg['seconds']}s)")
    print(f"{'='*60}")
    print(f"Prompt: {seg['prompt'][:200]}...")

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

concat_path = os.path.join(OUT_DIR, "concat.txt")
with open(concat_path, "w") as f:
    for r in results:
        f.write(f"file '{os.path.basename(r)}'\n")
print(f"Concat file: {concat_path}")
