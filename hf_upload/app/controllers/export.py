from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import xml.etree.ElementTree as ET
from datetime import datetime
from app.config import EXPORTS_DIR, UPLOADS_DIR
import subprocess

router = APIRouter(prefix="/export", tags=["export"])

class ExportRequest(BaseModel):
    segments: List[dict]
    video_id: str
    format: str # 'srt', 'vtt', 'xml', 'fcpxml', 'burn-in'
    style: Optional[dict] = None

@router.post("/generate")
async def generate_export(request: ExportRequest):
    if request.format == 'xml':
        return await export_premiere_xml(request)
    elif request.format == 'burn-in':
        return await export_burn_in(request)
    else:
        # Placeholder for other formats or return error
        raise HTTPException(status_code=400, detail=f"Format {request.format} not implemented yet")

async def export_premiere_xml(request: ExportRequest):
    """
    Generate a Premiere-compatible Final Cut Pro XML file.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"export_{timestamp}.xml"
    file_path = os.path.join(EXPORTS_DIR, filename)
    
    # Simplified FCP XML structure
    xmeml = ET.Element('xmeml', version="4")
    sequence = ET.SubElement(xmeml, 'sequence', id="Sequence 1")
    ET.SubElement(sequence, 'name').text = f"Al-Manara Export {timestamp}"
    ET.SubElement(sequence, 'duration').text = "3600" # Placeholder
    
    media = ET.SubElement(sequence, 'media')
    video = ET.SubElement(media, 'video')
    track = ET.SubElement(video, 'track')
    
    # Add video clip
    clipitem = ET.SubElement(track, 'clipitem', id="clipitem-1")
    ET.SubElement(clipitem, 'name').text = request.video_id
    ET.SubElement(clipitem, 'start').text = "0"
    ET.SubElement(clipitem, 'end').text = "3600"
    
    # Add Subtitles as Titles/Text items if possible, or just markers
    # For now, we'll create a simple XML and improve it.
    
    tree = ET.ElementTree(xmeml)
    tree.write(file_path, encoding='UTF-8', xml_declaration=True)
    
    return {"status": "success", "downloadUrl": f"/exports/{filename}", "filename": filename}

async def export_burn_in(request: ExportRequest):
    """
    Burn subtitles into video using FFmpeg.
    """
    # 1. Generate temp SRT
    srt_content = ""
    for i, seg in enumerate(request.segments):
        start = format_time_srt(seg['start'])
        end = format_time_srt(seg['end'])
        srt_content += f"{i+1}\n{start} --> {end}\n{seg['text']}\n\n"
        
    temp_srt = os.path.join(EXPORTS_DIR, f"temp_{request.video_id}.srt")
    with open(temp_srt, "w", encoding="utf-8") as f:
        f.write(srt_content)
        
    # 2. FFmpeg run
    input_video = os.path.join(UPLOADS_DIR, request.video_id)
    output_video_name = f"burnin_{request.video_id}"
    output_video = os.path.join(EXPORTS_DIR, output_video_name)
    
    # Command: ffmpeg -i input.mp4 -vf "subtitles=temp.srt" output.mp4
    # We use escaped path for Windows subtitles filter
    srt_path_esc = temp_srt.replace(":", "\\:").replace("\\", "/")
    cmd = [
        "ffmpeg", "-y", "-i", input_video,
        "-vf", f"subtitles='{srt_path_esc}'",
        "-c:a", "copy",
        output_video
    ]
    
    try:
        subprocess.run(cmd, check=True)
        return {"status": "success", "downloadUrl": f"/exports/{output_video_name}", "filename": output_video_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def format_time_srt(seconds: float) -> str:
    td = datetime.fromtimestamp(seconds)
    # This is a bit hacky for srt format (00:00:00,000)
    # Better to use math
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"
