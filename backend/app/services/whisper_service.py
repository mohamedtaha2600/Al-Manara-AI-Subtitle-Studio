"""
Whisper Service (Updated for faster-whisper)
خدمة ويسبر

Using faster-whisper for better compatibility and performance.
"""

import os
import asyncio
from typing import Optional, Callable, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Use models folder in project directory
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..", "models"))


class WhisperService:
    """
    Service class for Whisper transcription using faster-whisper.
    
    Features:
    - Auto-downloads model on first use
    - Supports multiple model sizes
    - Arabic and English optimization
    - Progress callbacks for real-time updates
    - Better performance with CTranslate2
    """
    
    def __init__(self, default_model: str = "base"):
        """
        Initialize Whisper service.
        
        Args:
            default_model: Default model size (tiny, base, small, medium, large-v3)
        """
        self.default_model = default_model
        self.model = None
        self.current_model_size = None
        
        # Create models directory if not exists
        os.makedirs(MODELS_DIR, exist_ok=True)
        self.models_dir = MODELS_DIR
        
        # Set environment variables to use local cache
        os.environ['HF_HOME'] = self.models_dir

    def update_models_dir(self, new_path: str):
        """Update the directory where models are stored/loaded from."""
        if not new_path:
            return
            
        abs_path = os.path.abspath(new_path)
        os.makedirs(abs_path, exist_ok=True)
        self.models_dir = abs_path
        os.environ['HF_HOME'] = abs_path
        print(f"[WHISPER] Models directory updated to: {abs_path}")

    def load_model(self, model_size: str = None, use_gpu: bool = True):
        """
        Load Whisper model (downloads if not present).
        
        Args:
            model_size: Model size to load
            use_gpu: Whether to use GPU acceleration if available
        """
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            raise ImportError(
                "faster-whisper not installed. Run: pip install faster-whisper"
            )
        
        size = model_size or self.default_model
        
        # Reload if model changed OR device mode changed
        # We need to track current device to know if we need to reload
        should_reload = (
            self.model is None or 
            self.current_model_size != size or
            getattr(self, 'current_use_gpu', True) != use_gpu
        )

        if should_reload:
            print(f"[WHISPER] Loading model: {size} (GPU: {use_gpu})...")
            print(f"[WHISPER] Models directory: {MODELS_DIR}")
            logger.info(f"Loading Whisper model: {size}")
            
            model_path = os.path.join(self.models_dir, size)
            if os.path.exists(model_path):
                print(f"[WHISPER] Loading local model from: {model_path}")
                model_arg = model_path
            else:
                print(f"[WHISPER] Model not found locally in {self.models_dir}, downloading: {size}")
                model_arg = size

            # 1. Attempt to add NVIDIA libraries to DLL path (Windows Fix)
            if os.name == 'nt' and use_gpu:
                try:
                    import nvidia.cublas.lib
                    import nvidia.cudnn.lib
                    
                    # The DLLs are often in the 'bin' directory, sibling to 'lib'
                    cublas_dir = os.path.join(os.path.dirname(os.path.dirname(nvidia.cublas.lib.__file__)), 'bin')
                    cudnn_dir = os.path.join(os.path.dirname(os.path.dirname(nvidia.cudnn.lib.__file__)), 'bin')
                    
                    if os.path.exists(cublas_dir):
                        os.add_dll_directory(cublas_dir)
                        os.environ['PATH'] = cublas_dir + os.pathsep + os.environ['PATH']
                    
                    if os.path.exists(cudnn_dir):
                        os.add_dll_directory(cudnn_dir)
                        os.environ['PATH'] = cudnn_dir + os.pathsep + os.environ['PATH']
                        
                    print(f"[WHISPER] Added DLL paths to System PATH: {cublas_dir}, {cudnn_dir}")
                except ImportError:
                    # Benign error: We already inject PATH in start_smart.bat
                    # No need to warn the user if this python-level check fails
                    pass
                except Exception as e:
                    # Only log generic errors as debug info, not warning
                    pass
            
            # Stablize GPU usage with int8 quantization (faster & less VRAM, same accuracy)
            compute_type = "int8" 
            device = "cpu"

            try:
                import torch
                if use_gpu and torch.cuda.is_available():
                    device = "cuda"
                    # compute_type = "float16" # Causing stalls on some cards
                    compute_type = "int8" # Safer and fast
                    gpu_name = torch.cuda.get_device_name(0)
                    print(f"[WHISPER] 🚀 GPU detected: {gpu_name}")
                    print(f"[WHISPER] Using CUDA acceleration (int8 quantization)")
                else:
                    if not use_gpu:
                        print(f"[WHISPER] 🛑 GPU disabled by user settings")
                    else:
                        print(f"[WHISPER] No GPU found, using CPU (slower)")
            except ImportError:
                print(f"[WHISPER] PyTorch not installed with CUDA, using CPU")
            
            print(f"[WHISPER] Attempting to load model on: {device}, Type: {compute_type}")

            try:
                self.model = WhisperModel(
                    model_arg,
                    device=device,
                    compute_type=compute_type,
                    cpu_threads=8, # Optimized for speed
                    download_root=self.models_dir if model_arg == size else None
                )
            except Exception as e:
                if device == "cuda":
                    print(f"[WHISPER] ⚠️ GPU Initialization failed: {e}")
                    print(f"[WHISPER] Falling back to CPU...")
                    logger.warning(f"GPU failed, falling back to CPU: {e}")
                    device = "cpu"
                    compute_type = "int8"
                    self.model = WhisperModel(
                        model_arg,
                        device=device,
                        compute_type=compute_type,
                        download_root=MODELS_DIR if model_arg == size else None
                    )
                else:
                    raise e
            
            self.current_model_size = size
            self.current_use_gpu = use_gpu
            print(f"[WHISPER] Model loaded successfully: {size} ({device})")
            logger.info(f"Whisper model loaded: {size} on {device}")
    
    async def transcribe(
        self,
        file_path: str,
        language: Optional[str] = None,
        model_size: Optional[str] = None,
        job_id: Optional[str] = None,
        task: str = "transcribe", 
        performance_mode: str = "accuracy",
        min_silence_ms: int = 250,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        use_gpu: bool = True,
        max_words_per_segment: int = 5,
        vad_enabled: bool = False,
        vad_threshold: float = 0.5,
        vad_segments: Optional[List[dict]] = None,
        initial_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio/video file.
        
        Args:
            file_path: Path to media file
            language: Target language (None for auto-detect)
            model_size: Whisper model size
            job_id: Job ID for logging
            task: Task type ("transcribe" or "translate")
            progress_callback: Function to call with progress updates
        
        Returns:
            dict: Transcription result with segments
        """
        def update_progress(percent: float, message: str):
            if progress_callback:
                progress_callback(percent, message)
        
        update_progress(5.0, "جاري تحميل نموذج الذكاء الاصطناعي... - Loading AI model...")
        
        # Load model in thread pool to not block
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.load_model(model_size, use_gpu=use_gpu)
        )
        
        update_progress(15.0, "جاري تحليل الملف الصوتي... - Analyzing audio file...")
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        update_progress(20.0, "جاري النسخ... قد يستغرق هذا بعض الوقت - Transcribing... This may take a while")
        
        # Run transcription in thread pool
        # Reduced beam size from 5 to 2 for Accuracy to prevent hanging
        beam_size = 1 if performance_mode == "speed" else 2 
        best_of = 1 if performance_mode == "speed" else 2
        temperature = 0.0 if performance_mode == "speed" else [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
        
        print(f"[WHISPER] Using Mode: {performance_mode.upper()} | Beam: {beam_size} | BestOf: {best_of}")

        transcribe_options = {
            "beam_size": beam_size,
            "best_of": best_of, 
            "temperature": temperature,
            "word_timestamps": True,
            "vad_filter": vad_enabled,
            "vad_parameters": dict(
                min_silence_duration_ms=min_silence_ms,
                threshold=vad_threshold
            ) if vad_enabled else None,
            "task": task,
            "initial_prompt": initial_prompt or "اكتب النص بالتشكيل وعلامات الترقيم بدقة. Write with punctuation and diacritics."
        }
        
        if language:
            transcribe_options["language"] = language
        
        def do_transcribe():
            print(f"[WHISPER] Starting model execution on {file_path}...")
            segments_gen, info = self.model.transcribe(file_path, **transcribe_options)
            return list(segments_gen), info
        
        segments_list, info = await loop.run_in_executor(None, do_transcribe)
        
        update_progress(90.0, "جاري معالجة النتائج... - Processing results...")
        
        # Format segments for frontend
        raw_segments = []
        for i, seg in enumerate(segments_list):
            raw_segments.append({
                "id": i,
                "start": round(seg.start, 3),
                "end": round(seg.end, 3),
                "text": seg.text.strip(),
                "confidence": round(seg.avg_logprob * -1, 2) if seg.avg_logprob else 0,
                "speaker": None,  # To be filled by diarization
                "words": [{
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "text": w.word.strip(),
                    "probability": round(w.probability, 2)
                } for w in (seg.words or [])]
            })
        
        # Smart Segment Splitting based on word timestamps
        segments = self._smart_segment_split(raw_segments, min_silence_ms, max_words_per_segment, vad_segments)
        
        # NEW: Clean Cut Algorithm (VAD Integration)
        if vad_enabled:
            segments = await self._apply_vad_trimming(file_path, segments, vad_segments)
            
        update_progress(100.0, "تم النسخ بنجاح! - Transcription complete!")
        
        detected_lang = info.language if hasattr(info, 'language') else (language or "unknown")
        
        return {
            "text": " ".join([s["text"] for s in segments]),
            "language": detected_lang,
            "segments": segments,
            "duration": segments[-1]["end"] if segments else 0
        }
    
    def load_model(self, model_size: str = None, use_gpu: bool = True):
        """
        Load Whisper model (downloads if not present).
        
        Args:
            model_size: Model size to load
            use_gpu: Whether to use GPU acceleration if available
        """
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            raise ImportError(
                "faster-whisper not installed. Run: pip install faster-whisper"
            )
        
        size = model_size or self.default_model
        
        # Reload if model changed OR device mode changed
        # We need to track current device to know if we need to reload
        should_reload = (
            self.model is None or 
            self.current_model_size != size or
            getattr(self, 'current_use_gpu', True) != use_gpu
        )

        if should_reload:
            print(f"[WHISPER] Loading model: {size} (GPU: {use_gpu})...")
            print(f"[WHISPER] Models directory: {MODELS_DIR}")
            logger.info(f"Loading Whisper model: {size}")
            
            model_path = os.path.join(MODELS_DIR, size)
            if os.path.exists(model_path):
                print(f"[WHISPER] Loading local model from: {model_path}")
                model_arg = model_path
            else:
                print(f"[WHISPER] Model not found locally, downloading: {size}")
                model_arg = size

            # 1. Attempt to add NVIDIA libraries to DLL path (Windows Fix)
            if os.name == 'nt' and use_gpu:
                try:
                    import nvidia.cublas.lib
                    import nvidia.cudnn.lib
                    
                    # The DLLs are often in the 'bin' directory, sibling to 'lib'
                    # We climb up from 'lib' module to the package root, then go to 'bin'
                    cublas_dir = os.path.join(os.path.dirname(os.path.dirname(nvidia.cublas.lib.__file__)), 'bin')
                    cudnn_dir = os.path.join(os.path.dirname(os.path.dirname(nvidia.cudnn.lib.__file__)), 'bin')
                    
                    if os.path.exists(cublas_dir):
                        os.add_dll_directory(cublas_dir)
                        os.environ['PATH'] = cublas_dir + os.pathsep + os.environ['PATH']
                    
                    if os.path.exists(cudnn_dir):
                        os.add_dll_directory(cudnn_dir)
                        os.environ['PATH'] = cudnn_dir + os.pathsep + os.environ['PATH']
                        
                    print(f"[WHISPER] Added DLL paths to System PATH: {cublas_dir}, {cudnn_dir}")
                except (ImportError, AttributeError, Exception) as e:
                    print(f"[WHISPER] Warning: Could not add NVIDIA DLL paths: {e}")
                    pass

            # Stablize GPU usage with int8 quantization (faster & less VRAM, same accuracy)
            compute_type = "int8" 
            device = "cpu"

            try:
                import torch
                if use_gpu and torch.cuda.is_available():
                    device = "cuda"
                    # compute_type = "float16" # Causing stalls on some cards
                    compute_type = "int8" # Safer and fast
                    gpu_name = torch.cuda.get_device_name(0)
                    print(f"[WHISPER] 🚀 GPU detected: {gpu_name}")
                    print(f"[WHISPER] Using CUDA acceleration (int8 quantization)")
                else:
                    if not use_gpu:
                        print(f"[WHISPER] 🛑 GPU disabled by user settings")
                    else:
                        print(f"[WHISPER] No GPU found, using CPU (slower)")
            except ImportError:
                print(f"[WHISPER] PyTorch not installed with CUDA, using CPU")
            
            print(f"[WHISPER] Attempting to load model on: {device}, Type: {compute_type}")

            try:
                self.model = WhisperModel(
                    model_arg,
                    device=device,
                    compute_type=compute_type,
                    cpu_threads=8, # Optimized for speed
                    download_root=MODELS_DIR if model_arg == size else None
                )
            except Exception as e:
                if device == "cuda":
                    print(f"[WHISPER] ⚠️ GPU Initialization failed: {e}")
                    print(f"[WHISPER] Falling back to CPU...")
                    logger.warning(f"GPU failed, falling back to CPU: {e}")
                    device = "cpu"
                    compute_type = "int8"
                    self.model = WhisperModel(
                        model_arg,
                        device=device,
                        compute_type=compute_type,
                        download_root=MODELS_DIR if model_arg == size else None
                    )
                else:
                    raise e
            
            self.current_model_size = size
            self.current_use_gpu = use_gpu
            print(f"[WHISPER] Model loaded successfully: {size} ({device})")
            logger.info(f"Whisper model loaded: {size} on {device}")
    
    def _smart_segment_split(self, raw_segments: list, min_silence_ms: int = 150, max_words_per_segment: int = 5, vad_segments: Optional[List[dict]] = None) -> list:
        """
        Intelligently split segments using VAD-First approach.
        Priority:
        1. VAD Containers (provided by browser) -> Non-negotiable breaks.
        2. Sentence Endings (within a VAD container).
        3. Word Count (with smart buffer).
        """
        all_words = []
        for seg in raw_segments:
            for word in seg.get("words", []):
                all_words.append(word)

        # 0. PRE-FILTER VAD SEGMENTS (Min Duration Filter: 100ms)
        if vad_segments:
            initial_count = len(vad_segments)
            vad_segments = [vs for vs in vad_segments if (float(vs.get("end", 0)) - float(vs.get("start", 0))) >= 0.1]
            if len(vad_segments) < initial_count:
                print(f"[WHISPER] 🧹 Filtered {initial_count - len(vad_segments)} noise/breath VAD blocks (<100ms)")

        # 1. GROUP WORDS INTO VAD CONTAINERS
        if vad_segments and len(vad_segments) > 0:
            print(f"[WHISPER] 🛰️ VAD Master Truth Mode: {len(vad_segments)} blocks")
            buckets = [[] for _ in range(len(vad_segments))]
            unassigned = []

            for word in all_words:
                w_start = float(word["start"])
                w_end = float(word["end"])
                w_mid = (w_start + w_end) / 2
                
                # Find best matching VAD segment
                best_vs_idx = -1
                best_score = -1.0 # overlap or proximity
                
                for idx, vs in enumerate(vad_segments):
                    v_start = float(vs.get("start", 0))
                    v_end = float(vs.get("end", 0))
                    
                    # 1. Is it inside?
                    if v_start <= w_mid <= v_end:
                        best_vs_idx = idx
                        break # Perfect match
                    
                    # 2. Check overlap
                    overlap_start = max(w_start, v_start)
                    overlap_end = min(w_end, v_end)
                    overlap = max(0.0, overlap_end - overlap_start)
                    
                    if overlap > 0 and overlap > best_score:
                        best_score = overlap
                        best_vs_idx = idx
                
                if best_vs_idx != -1:
                    buckets[best_vs_idx].append(word)
                else:
                    unassigned.append(word)

            print(f"[WHISPER] Clustering Done. Buckets counts: {[len(b) for b in buckets]}. Unassigned: {len(unassigned)}")

            # Handle unassigned (assign to nearest VAD segment)
            for word in unassigned:
                nearest_idx = -1
                min_dist = float('inf')
                w_mid = (float(word["start"]) + float(word["end"])) / 2
                for idx, vs in enumerate(vad_segments):
                    v_start = float(vs.get("start", 0))
                    v_end = float(vs.get("end", 0))
                    dist = min(abs(w_mid - v_start), abs(w_mid - v_end))
                    if dist < min_dist:
                        min_dist = dist
                        nearest_idx = idx
                if nearest_idx != -1 and min_dist < 0.5: # 500ms safety
                    buckets[nearest_idx].append(word)
            
            # Sort buckets by word start time just in case
            for b in buckets:
                b.sort(key=lambda x: x["start"])

            # 3. SPLIT BUCKETS: Browser as Boss Logic
            # Treat each VAD block as ONE subtitle segment unless it's truly massive (> 12 words)
            final_chunks = []
            for b_words in buckets:
                if not b_words: continue
                
                # Check if we should split this VAD block
                # If it's less than 12 words, TRUST the browser's rhythmic cut (Don't split)
                if len(b_words) <= 12:
                    final_chunks.append(b_words)
                else:
                    # Only split if it's a "Wall of Text" within one breath
                    print(f"[WHISPER] ✂️ Splitting large VAD block ({len(b_words)} words)")
                    final_chunks.extend(self._recursive_smart_split(b_words, max_words_per_segment))
            
            # Add back any totally lost words (should be zero or rare)
            # ... skipping for brevity, usually not needed if VAD is good
            
        else:
            # Fallback to pure model-based splitting
            print("[WHISPER] ⚠️ No VAD segments provided, falling back to model-base splitting")
            final_chunks = self._recursive_smart_split(all_words, max_words_per_segment)

        # 2. CONVERT TO SEGMENT FORMAT
        refined_segments = []
        for i, chunk in enumerate(final_chunks):
            if not chunk: continue
            seg_text = " ".join([w["text"] for w in chunk]).strip()
            refined_segments.append({
                "id": i,
                "start": round(chunk[0]["start"], 3),
                "end": round(chunk[-1]["end"], 3),
                "text": seg_text,
                "confidence": sum([w.get("probability", 0) for w in chunk]) / len(chunk),
                "words": chunk
            })

            print(f"[WHISPER] Final Split Result: {len(refined_segments)} segments")
        return refined_segments

    def _recursive_smart_split(self, words_chunk: list, max_words: int) -> list:
        """
        The core recursive splitting logic.
        Refined for:
        1. Punctuation + Silence Gap (200ms)
        2. Smart Merging (2 words over limit if it completes a phrase)
        """
        if not words_chunk: return []
        
        count = len(words_chunk)
        # Limits
        SOFT_LIMIT = max_words + 2
        MAX_CHARS = 80
        MAX_DURATION = 6.0
        MIN_WORDS = 2

        # Join text for char count
        text_str = " ".join([w["text"] for w in words_chunk]).strip()
        char_count = len(text_str)
        duration = words_chunk[-1]["end"] - words_chunk[0]["start"]
        
        # Check punctuation at end
        last_txt = words_chunk[-1]["text"].strip()
        last_word_punctuated = last_txt and last_txt[-1] in ".؟?!!"

        if count <= SOFT_LIMIT and last_word_punctuated:
            # Check for any LARGE internal gap (> 200ms) that should have been a cut
            has_major_gap = False
            for k in range(len(words_chunk) - 1):
                if (words_chunk[k+1]["start"] - words_chunk[k]["end"]) > 0.2:
                    has_major_gap = True
                    break
            if not has_major_gap:
                return [words_chunk]
            
        # If it fits within standard limits, leave it alone
        if count <= max_words and char_count <= MAX_CHARS and duration <= MAX_DURATION:
            return [words_chunk]

        # 2. RECURSIVE STEP: Find best split point
        best_split_idx = -1
        best_score = -1

        for i in range(1, count):
            w_curr = words_chunk[i-1]
            w_next = words_chunk[i]
            gap = w_next["start"] - w_curr["end"]
            
            # Punctuation Score
            punct_score = 0
            curr_text = w_curr["text"].strip()
            is_strong_punct = False
            if curr_text:
                if curr_text[-1] in ".؟?!": 
                    punct_score = 2.0
                    is_strong_punct = True
                elif curr_text[-1] in "،,;:": 
                    punct_score = 1.0
            
            # 3. PUNCTUATION + SILENCE GAP (Special Rule)
            # "بحث عن أقرب 'فجوة صمت' (منطقة سوداء) بعدها مباشرة"
            gap_score = 0
            if is_strong_punct and gap > 0.2: # 200ms silence after punctuation
                gap_score = 15.0 # Extremely high priority
            else:
                gap_score = min(gap / 0.4, 1.0) * 5.0
            
            # Conjunction Score (Arabic)
            conj_score = 0
            nxt_text = w_next["text"].strip()
            if nxt_text.startswith("و") and len(nxt_text) > 2: conj_score = 0.6
            elif nxt_text in ["ثم", "لكن", "بل", "يعني"]: conj_score = 0.8

            # Balance Score
            curr_perc = i / count
            balance_score = 1.0 - abs(0.5 - curr_perc) * 2 # 0.0 at edges, 1.0 at center

            # Orphan Penalty
            orphan_penalty = 0
            if i < MIN_WORDS or (count - i) < MIN_WORDS: orphan_penalty = 2.0

            total_score = (punct_score * 10.0) + gap_score + (conj_score * 3.0) + (balance_score * 2.0) - (orphan_penalty * 10.0)

            if total_score > best_score:
                best_score = total_score
                best_split_idx = i

        if best_split_idx == -1: best_split_idx = count // 2

        return self._recursive_smart_split(words_chunk[:best_split_idx], max_words) + \
               self._recursive_smart_split(words_chunk[best_split_idx:], max_words)


    async def _apply_vad_trimming(self, file_path: str, segments: list, vad_segments: Optional[list] = None) -> list:
        """
        MASTER TRUTH Snapping:
        Any subtitle segment must start and end EXACTLY with its corresponding VAD block.
        """
        if not vad_segments:
            print("[WHISPER] ⚠️ No VAD data for snapping. Using basic tightening.")
            for seg in segments:
                if seg.get("words"):
                    seg["start"] = max(0, seg["words"][0]["start"] - 0.05)
                    seg["end"] = seg["words"][-1]["end"] + 0.1
            return segments

        print(f"[WHISPER] Applying MASTER TRUTH Snapping ({len(vad_segments)} VAD blocks)...")
        
        for seg in segments:
            if not seg.get("words"):
                continue
                
            first_word_center = (seg["words"][0]["start"] + seg["words"][0]["end"]) / 2
            last_word_center = (seg["words"][-1]["start"] + seg["words"][-1]["end"]) / 2
            
            # Find which VAD block this segment belongs to
            # Usually it's one block, but might be multiple if merged
            matched_blocks = []
            for vs in vad_segments:
                v_start = float(vs["start"])
                v_end = float(vs["end"])
                # Check if this VAD block contains any of our words
                for w in seg["words"]:
                    w_mid = (w["start"] + w["end"]) / 2
                    if v_start <= w_mid <= v_end:
                        matched_blocks.append(vs)
                        break
            
            if matched_blocks:
                # Strictly snap to the bounds of the matched VAD block(s)
                seg["start"] = min(float(b["start"]) for b in matched_blocks)
                seg["end"] = max(float(b["end"]) for b in matched_blocks)
            else:
                # Fallback if no VAD match (unlikely with our clustering)
                seg["start"] = max(0, seg["words"][0]["start"] - 0.05)
                seg["end"] = seg["words"][-1]["end"] + 0.1
        
        # 3. Handle Overlaps & Ensure NO bleed into silence
        for i in range(len(segments) - 1):
            if segments[i]["end"] > segments[i+1]["start"]:
                # If they overlap, split the difference
                mid = (segments[i]["end"] + segments[i+1]["start"]) / 2
                segments[i]["end"] = mid
                segments[i+1]["start"] = mid

        return segments

    def restore_punctuation(self, text: str) -> str:
        """
        Restore punctuation to a plain text string using NLTK and Heuristics.
        Optimized for Arabic and English.
        """
        if not text:
            return text
            
        try:
            import nltk
            # Set local path
            nltk_cache = os.path.join(os.path.dirname(__file__), "../../../cache/nltk_data")
            if os.path.exists(nltk_cache) and nltk_cache not in nltk.data.path:
                nltk.data.path.append(nltk_cache)
            
            # 1. Handle English Casing (if applicable)
            is_english = any(ord(c) < 128 and c.isalpha() for c in text)
            
            if is_english:
                sentences = nltk.sent_tokenize(text)
                text = " ".join([s.capitalize() if s[0].islower() else s for s in sentences])
            
            # 2. Arabic Specific Heuristic
            is_arabic = any('\u0600' <= c <= '\u06FF' for c in text)
            if is_arabic:
                # Basic rule: If the segment is long enough and ends without punctuation, add a period
                clean_text = text.strip()
                if clean_text and clean_text[-1] not in ".،؟?!؛;:":
                    # If more than 3 words, highly likely a completed thought or phrase
                    if len(clean_text.split()) >= 3:
                        text = clean_text + "."
            
            # 3. Last resort check: Always ensure a final period if reasonably long
            text = text.strip()
            if text and len(text) > 10 and text[-1] not in ".،؟?!؛;:":
                text += "."
                
            return text
        except Exception as e:
            print(f"[WHISPER] Punctuation Restoration Error: {e}")
            # Fallback to basic trailing dot
            if text and len(text) > 10 and text.strip()[-1] not in ".،؟?!":
                return text.strip() + "."
            return text
    
    async def detect_language(self, file_path: str) -> str:
        """
        Detect the language of an audio file.
        
        Args:
            file_path: Path to audio file
        
        Returns:
            str: Detected language code
        """
        self.load_model("base")  # Use small model for detection
        
        _, info = self.model.transcribe(
            file_path,
            beam_size=1,
            vad_filter=True
        )
        
        return info.language if hasattr(info, 'language') else "unknown"
    
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages."""
        return [
            {"code": "ar", "name": "Arabic", "native": "العربية"},
            {"code": "en", "name": "English", "native": "English"},
            {"code": "fr", "name": "French", "native": "Français"},
            {"code": "es", "name": "Spanish", "native": "Español"},
            {"code": "de", "name": "German", "native": "Deutsch"},
            {"code": "it", "name": "Italian", "native": "Italiano"},
            {"code": "pt", "name": "Portuguese", "native": "Português"},
            {"code": "ru", "name": "Russian", "native": "Русский"},
            {"code": "ja", "name": "Japanese", "native": "日本語"},
            {"code": "ko", "name": "Korean", "native": "한국어"},
            {"code": "zh", "name": "Chinese", "native": "中文"},
            {"code": "tr", "name": "Turkish", "native": "Türkçe"},
        ]

    def get_installed_models(self) -> list:
        """
        Get list of installed models in the models directory.
        
        Returns:
            list: List of installed model names (e.g. ['base', 'medium'])
        """
        if not os.path.exists(self.models_dir):
            return []
            
        installed = []
        valid_models = ["tiny", "base", "small", "medium", "large-v3", "large-v2", "large"]
        
        for name in valid_models:
            # Check for direct directory match
            model_path = os.path.join(self.models_dir, name)
            
            # Check if it exists as a directory with .bin or .onnx or .json (config)
            if os.path.isdir(model_path):
                files = os.listdir(model_path)
                if any(f.endswith(('.bin', '.onnx', '.json', '.txt')) for f in files):
                    installed.append(name)
                
        return installed

