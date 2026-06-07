> ⚠️ **RunPod wurde durch fal.ai ersetzt.**  
> Diese Doku ist veraltet.

# RunPod Worker — Live Avatar Render

## Übersicht
FasterLivePortrait auf RunPod Serverless.
Asynchroner Render-Job: Source Image + Driving Video → Avatar Video.

## Voraussetzungen
- RunPod Account mit Guthaben
- Docker installiert lokal
- NVIDIA GPU lokal (für Tests)
- `RUNPOD_API_KEY` in `.env.local`
- `RUNPOD_ENDPOINT_ID` in `.env.local`

## Lizenz-Check (PFLICHT vor Deployment)
Bevor du deployest:
- LivePortrait: MIT Lizenz ✅
- FasterLivePortrait: MIT Lizenz ✅
- InsightFace buffalo_l: NICHT kommerziell nutzbar ⚠️
  - Alternative: verwende nur LivePortrait ohne InsightFace
  - oder: eigene Face Detection Lösung
- Modellgewichte: separat prüfen

## Lokaler Test (Phase 1)
Bevor RunPod:

1. FasterLivePortrait lokal installieren:

```bash
git clone https://github.com/KlingAIResearch/LivePortrait
cd LivePortrait
conda create -n LivePortrait python=3.10
conda activate LivePortrait
pip install -r requirements.txt
```

2. Test-Render:

```bash
python inference.py \
  -s assets/examples/source/s9.jpg \
  -d assets/examples/driving/d0.mp4
```

3. Output prüfen:
- Video existiert?
- Gesicht sichtbar?
- Mundbewegung plausibel?
- Keine massiven Artefakte?

## Docker Container (Phase 2)

Verzeichnisstruktur:

```
/avatar-worker
  Dockerfile
  handler.py
  requirements.txt
  src/
    run_liveportrait.py
    download_inputs.py
    upload_outputs.py
    quality_check.py
```

Dockerfile:

```dockerfile
FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg git
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "handler.py"]
```

requirements.txt:

```
runpod
torch
torchvision
opencv-python
ffmpeg-python
numpy
Pillow
boto3
requests
```

handler.py (Grundstruktur):

```python
import runpod
import requests
import os

def download_file(url, local_path):
    r = requests.get(url, stream=True)
    with open(local_path, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)

def run_liveportrait(source_image, driving_video, options):
    # TODO: FasterLivePortrait Integration
    # python inference.py -s source -d driving
    pass

def quality_check(output_path):
    import os
    if not os.path.exists(output_path):
        return {"passed": False, "issues": ["Video nicht erstellt"]}
    size = os.path.getsize(output_path)
    if size < 1000:
        return {"passed": False, "issues": ["Video zu klein"]}
    return {"passed": True, "issues": []}

def handler(event):
    input_data = event["input"]
    job_id = input_data["jobId"]
    source_url = input_data["sourceImageUrl"]
    driving_url = input_data["drivingVideoUrl"]
    options = input_data.get("options", {})
    callback_url = input_data.get("callbackUrl")

    try:
        # Download
        download_file(source_url, "/tmp/source.jpg")
        download_file(driving_url, "/tmp/driving.mp4")

        # Render
        run_liveportrait(
            "/tmp/source.jpg",
            "/tmp/driving.mp4",
            options
        )

        # Quality Check
        report = quality_check("/tmp/output.mp4")

        # Upload Output (TODO: zu R2/S3)
        output_url = "TODO: upload /tmp/output.mp4"

        # Callback
        if callback_url:
            requests.post(callback_url, json={
                "jobId": job_id,
                "status": "COMPLETED" if report["passed"]
                    else "FAILED",
                "output": {
                    "rawOutputUrl": output_url,
                    "qualityReport": report,
                }
            })

        return {
            "jobId": job_id,
            "status": "completed",
            "rawOutputUrl": output_url,
            "qualityReport": report,
        }

    except Exception as e:
        if callback_url:
            requests.post(callback_url, json={
                "jobId": job_id,
                "status": "FAILED",
                "error": str(e),
            })
        return {"error": str(e)}

runpod.serverless.start({"handler": handler})
```

## RunPod Deployment (Phase 3)

1. Docker Image bauen:

```bash
docker build -t influexai-avatar-worker .
```

2. In Registry pushen:

```bash
docker tag influexai-avatar-worker \
  your-registry/influexai-avatar-worker:latest
docker push your-registry/influexai-avatar-worker:latest
```

3. RunPod Serverless Endpoint erstellen:
- runpod.io → Serverless → New Endpoint
- Container Image: `your-registry/influexai-avatar-worker`
- GPU: RTX 4090 (empfohlen für MVP)
- Min Workers: 0
- Max Workers: 3
- Idle Timeout: 30s

4. API Key + Endpoint ID in `.env.local`:

```
RUNPOD_API_KEY=your_key
RUNPOD_ENDPOINT_ID=your_endpoint_id
```

5. Test-Job:

```bash
curl -X POST \
  https://api.runpod.ai/v2/{ENDPOINT_ID}/run \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "jobId": "test_123",
      "sourceImageUrl": "https://...",
      "drivingVideoUrl": "https://...",
      "options": {
        "durationSeconds": 15,
        "resolution": "720p",
        "aspectRatio": "9:16"
      }
    }
  }'
```

## GPU Empfehlungen

| GPU       | VRAM | Geschwindigkeit | Kosten/h |
|-----------|------|-----------------|----------|
| RTX 4090  | 24GB | Schnell         | ~$0.74   |
| L40S      | 48GB | Sehr schnell    | ~$1.14   |
| RTX 3090  | 24GB | OK              | ~$0.44   |

Für MVP: RTX 4090 — gutes Preis/Leistungs-Verhältnis.

## Kostenkalkulation
30s Video auf RTX 4090:
- Render-Zeit ca. 45–90 Sekunden
- Kosten ca. $0.01–0.02 pro Job
- Bei 9 Credits = €0.90 Einnahmen pro Job
- Marge sehr gut ✅

## TODO Liste
- [ ] Lokaler Test mit LivePortrait
- [ ] Lizenz InsightFace klären
- [ ] Docker Container bauen
- [ ] RunPod Endpoint erstellen
- [ ] Test-Job mit echtem Bild+Video
- [ ] Output-Upload zu Supabase Storage
- [ ] Webhook Secret validieren
- [ ] Quality Check verbessern
- [ ] FFmpeg Compositing für Untertitel/Branding
