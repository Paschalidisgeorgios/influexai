# RunPod Worker — Live Avatar Render

## Übersicht
FasterLivePortrait auf RunPod Serverless.

## Input JSON
```json
{
  "jobId": "job_123",
  "sourceImageUrl": "signed-url",
  "drivingVideoUrl": "signed-url",
  "options": {
    "durationSeconds": 30,
    "resolution": "720p",
    "aspectRatio": "9:16",
    "subtitles": false,
    "branding": false,
    "voiceover": false
  },
  "callbackUrl": "https://influexaicreator.com/api/avatar/runpod-callback"
}
```

## Output JSON
```json
{
  "jobId": "job_123",
  "status": "completed",
  "rawOutputUrl": "https://...",
  "qualityReport": {
    "passed": true,
    "issues": []
  },
  "metrics": {
    "renderSeconds": 42,
    "gpu": "RTX 4090"
  }
}
```

## Docker Container
- Python 3.10
- FasterLivePortrait
- FFmpeg
- handler.py
- RunPod SDK

## TODO
- [ ] Docker Image bauen
- [ ] RunPod Endpoint erstellen
- [ ] GPU wählen (RTX 4090 / L40S)
- [ ] Lizenzen prüfen (InsightFace buffalo_l)
- [ ] Env Vars setzen
- [ ] Testjob schicken
