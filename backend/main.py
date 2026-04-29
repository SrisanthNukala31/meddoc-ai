# ============================================================
#  X-Ray Analyzer — Fully Local ML Pipeline  v3.0
#  No external APIs.  No LLMs.  No cloud calls.
#
#  Body-part detection v3:
#   • Hard discriminant rules (aspect ratio gating)
#   • Finger structure detection (column-peak analysis)
#   • Bone component size distribution
#   • Penalties for contradictory features
#
#  Pathology pipeline:
#   • 3-method consensus fracture detection (CLAHE + cortical +
#     GLCM texture + gradient magnitude)
#   • Body-part-aware dislocation (joint-axis alignment)
#   • Bone wear / osteoarthritis detection
#   • Chest X-ray: torchxrayvision DenseNet121 (18 pathologies)
# ============================================================

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
import uvicorn
import cv2
import numpy as np
from PIL import Image
import io, base64, logging, math, pickle, os
import torch
import torchvision.transforms as transforms
from typing import List, Dict, Any, Tuple
from scipy.ndimage import uniform_filter1d
from scipy.sparse import hstack, csr_matrix
import difflib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from apscheduler.schedulers.background import BackgroundScheduler
from supabase import create_client, Client
from datetime import datetime
import json
from dotenv import load_dotenv
try:
    from pywebpush import webpush, WebPushException
except ImportError:
    webpush = None
    WebPushException = Exception

load_dotenv()

logging.basicConfig(level=logging.INFO,
                    format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger("xray-api")

# ── Supabase & Email Config ──────────────────────────────────
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Needs service role key to bypass RLS
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")

supabase_client: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

def send_email_notification(to_email, medicine_name, dosage, notes):
    if not all([SMTP_USER, SMTP_PASSWORD, to_email]):
        logger.warning("SMTP credentials or recipient email missing. Skipping email.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = f"Medicine Reminder: Time for {medicine_name}"

        # Enhanced email body with medicine details
        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
              <h2 style="color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px;">💊 Medicine Reminder</h2>
              
              <div style="background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
                <p style="margin: 0 0 15px 0;"><strong>It's time to take your medicine:</strong></p>
                
                <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #14b8a6; border-radius: 4px;">
                  <p style="margin: 5px 0;"><strong>Medicine Name:</strong> {medicine_name}</p>
                  <p style="margin: 5px 0;"><strong>Dosage:</strong> {dosage or 'As prescribed'}</p>
                  {f'<p style="margin: 5px 0;"><strong>Notes:</strong> {notes}</p>' if notes else '<p style="margin: 5px 0;"><strong>Notes:</strong> None</p>'}
                </div>
                
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                  Please remember to take your medicine as prescribed. If you have any concerns, consult with your healthcare provider.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                <p>Stay healthy! MedDoc AI Team</p>
              </div>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent to {to_email} for {medicine_name}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

def send_web_push_notification(user_id, medicine_name, dosage, notes):
    if not webpush or not VAPID_PRIVATE_KEY or not supabase_client:
        return
    try:
        subs = supabase_client.table("push_subscriptions").select("*").eq("user_id", user_id).execute()
        if not subs.data:
            return
        
        payload = json.dumps({
            "title": f"Time for {medicine_name}!",
            "body": f"Dosage: {dosage or 'As prescribed'}\nNotes: {notes or 'None'}",
            "url": "/reminders",
            "icon": "/vite.svg"
        })
        
        for sub_record in subs.data:
            try:
                subscription_info = sub_record.get("subscription")
                if isinstance(subscription_info, str):
                    subscription_info = json.loads(subscription_info)
                
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": "mailto:admin@meddoc-ai.com"}
                )
                logger.info(f"Web push sent to {user_id}")
            except WebPushException as ex:
                logger.error(f"Web push failed: {ex}")
                if ex.response is not None and ex.response.status_code in [404, 410]:
                    # Delete invalid subscription
                    supabase_client.table("push_subscriptions").delete().eq("id", sub_record["id"]).execute()
    except Exception as e:
        logger.error(f"Error sending web push: {e}")

def check_medicine_reminders():
    if not supabase_client:
        logger.warning("Supabase client not initialized. Skipping medicine reminders.")
        return

    try:
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        current_date = now.date()
        
        logger.info(f"Checking medicine reminders at {current_time} on {current_date}")
        
        # Query active medicines
        response = supabase_client.table("user_medicines") \
            .select("*") \
            .eq("is_active", True) \
            .lte("start_date", current_date) \
            .execute()

        if not response.data:
            logger.info("No active medicine reminders found.")
            return

        for med in response.data:
            # Check duration
            start_date = datetime.fromisoformat(med.get("start_date")).date()
            duration_days = med.get("duration_days")
            
            if duration_days:
                days_passed = (current_date - start_date).days
                if days_passed >= duration_days:
                    logger.info(f"Medicine {med.get('name')} duration expired, skipping.")
                    continue
            
            times = med.get("times", [])
            
            # Check if current time matches any scheduled time
            if current_time in times:
                user_id = med.get("user_id")
                
                # Send email if enabled
                if med.get("email_notifications"):
                    user_email = None
                    # Fetch email via admin API
                    try:
                        user_obj = supabase_client.auth.admin.get_user_by_id(user_id)
                        if user_obj and user_obj.user:
                            user_email = user_obj.user.email
                    except Exception as email_err:
                        logger.warning(f"Could not fetch email for {user_id}: {email_err}")
                        
                    if user_email:
                        logger.info(f"Sending reminder for {med.get('name')} to {user_email}")
                        send_email_notification(
                            user_email, 
                            med.get("name"), 
                            med.get("dosage"), 
                            med.get("notes")
                        )
                    else:
                        logger.warning(f"No email found for medicine: {med.get('name', 'Unknown')}")
                        
                # Also send web push notification
                if user_id:
                    send_web_push_notification(
                        med.get("user_id"),
                        med.get("name"), 
                        med.get("dosage"), 
                        med.get("notes")
                    )
    except Exception as e:
        logger.error(f"Error checking reminders: {e}", exc_info=True)

# ── Globals ──────────────────────────────────────────────────
chest_model = None
device      = None
disease_model   = None
feature_columns = None
ohe             = None
label_encoder   = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global chest_model, device, disease_model, feature_columns, ohe, label_encoder
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")
    _load_chest_model()
    _load_disease_model()
    
    # Start scheduler for medicine reminders
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_medicine_reminders, 'cron', minute='*')
    scheduler.start()
    logger.info("Medicine reminder scheduler started.")
    
    yield
    scheduler.shutdown()


def _load_chest_model():
    global chest_model
    try:
        import torchxrayvision as xrv
        chest_model = xrv.models.DenseNet(weights="densenet121-res224-all")
        chest_model.eval().to(device)
        logger.info("torchxrayvision DenseNet121 loaded (18 pathologies)")
    except Exception as e:
        chest_model = None
        logger.warning(f"torchxrayvision unavailable – chest analysis skipped: {e}")

def _load_disease_model():
    global disease_model, feature_columns, ohe, label_encoder
    try:
        # Check possible paths for the ml folder (Docker root vs local dev)
        possible_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml')),
            os.path.abspath(os.path.join(os.path.dirname(__file__), 'ml')),
            os.path.abspath(os.path.dirname(__file__))
        ]
        
        base_path = next((p for p in possible_paths if os.path.exists(os.path.join(p, 'feature_columns.pkl'))), None)
        
        if not base_path:
            raise FileNotFoundError("Could not find ML files (feature_columns.pkl) in any expected directory.")

        # Try loading models in order of preference (Highest Accuracy First)
        model_names = ['model_bernoulli_nb.pkl', 'model.pkl', 'model_xgb_fast.pkl']
        model_loaded = False
        
        for m_name in model_names:
            m_path = os.path.join(base_path, m_name)
            if os.path.exists(m_path):
                with open(m_path, 'rb') as f:
                    disease_model = pickle.load(f)
                logger.info(f"Loaded ML model: {m_name}")
                model_loaded = True
                break
                
        if not model_loaded:
            raise FileNotFoundError("No valid model.pkl or fallback found.")

        with open(os.path.join(base_path, 'feature_columns.pkl'), 'rb') as f:
            feature_columns = pickle.load(f)
        with open(os.path.join(base_path, 'label_encoder.pkl'), 'rb') as f:
            label_encoder = pickle.load(f)
        with open(os.path.join(base_path, 'ohe.pkl'), 'rb') as f:
            ohe = pickle.load(f)
        logger.info("Local Disease ML Model and Encoders loaded correctly.")
    except Exception as e:
        logger.error(f"Disease ML model unavailable: {e}")
        disease_model = None


app = FastAPI(title="X-Ray Analyzer – Local ML v3",
              version="3.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/api/test-email")
async def test_email(email: str):
    """Test endpoint to verify SMTP settings."""
    if not email:
        raise HTTPException(status_code=400, detail="Email parameter is required")
    
    try:
        send_email_notification(
            email, 
            "Test Medicine", 
            "1 Tablet", 
            "This is a test notification from MedDoc AI."
        )
        return {"status": "success", "message": f"Test email sent to {email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SymptomRequest(BaseModel):
    symptoms: List[str]

@app.post("/api/predict-disease")
async def predict_disease(req: SymptomRequest):
    if not all([disease_model, feature_columns, ohe, label_encoder]):
        raise HTTPException(status_code=500, detail="ML Model not loaded.")
    
    input_features = np.zeros(len(feature_columns), dtype=np.uint8)
    recognized_symptoms = []
    
    for sympt in req.symptoms:
        sympt = sympt.lower().strip()
        if sympt in feature_columns:
            if input_features[feature_columns.index(sympt)] == 0:
                input_features[feature_columns.index(sympt)] = 1
                recognized_symptoms.append(sympt)
        else:
            # Fuzzy match for typos/spelling mistakes
            matches = difflib.get_close_matches(sympt, feature_columns, n=1, cutoff=0.6)
            if matches:
                best_match = matches[0]
                if input_features[feature_columns.index(best_match)] == 0:
                    input_features[feature_columns.index(best_match)] = 1
                    recognized_symptoms.append(best_match)
                    logger.info(f"Fuzzy matched typo '{sympt}' -> '{best_match}'")
            else:
                # Log unmapped symptoms
                logger.warning(f"Symptom '{sympt}' could not be matched to any feature.")
                
    row_string = "".join(str(x) for x in input_features)
    X_base = np.array([input_features])
    X_hashed = ohe.transform([[row_string]])
    X_final = hstack([csr_matrix(X_base), X_hashed])
    
    prediction_idx = disease_model.predict(X_final)[0]
    predicted_disease = label_encoder.inverse_transform([prediction_idx])[0]
    
    confidence = 0.99
    if hasattr(disease_model, "predict_proba"):
        probs = disease_model.predict_proba(X_final)[0]
        confidence = float(np.max(probs))
        
    return {
        "predicted_disease": predicted_disease,
        "confidence": round(confidence * 100, 2),
        "recognized_symptoms": recognized_symptoms
    }

# ── Clinical reference data ───────────────────────────────────
PATHOLOGY_DESC: Dict[str, str] = {
    "Atelectasis":        "Partial/complete collapse of lung tissue",
    "Consolidation":      "Lung tissue filled with fluid instead of air",
    "Infiltration":       "Abnormal substance in lung parenchyma",
    "Pneumothorax":       "Air in pleural space — lung may collapse",
    "Edema":              "Excess fluid in lung tissue",
    "Emphysema":          "Destruction of alveolar walls",
    "Fibrosis":           "Irreversible scarring of lung tissue",
    "Effusion":           "Fluid accumulation in pleural space",
    "Pneumonia":          "Infection causing alveolar inflammation",
    "Pleural_Thickening": "Thickening of pleural lining",
    "Cardiomegaly":       "Enlarged cardiac silhouette (CTR > 0.5)",
    "Nodule":             "Small round opacity — needs evaluation",
    "Mass":               "Large opacity (>3 cm) — clinical correlation required",
    "Hernia":             "Abdominal organ herniation into thorax",
    "Fracture":           "Cortical bone interruption detected",
}

BODY_PART_RISK_FACTORS: Dict[str, List[str]] = {
    "Chest":      ["Smoking", "Respiratory infections", "Cardiac risk factors"],
    "Hand/Wrist": ["Fall on outstretched hand (FOOSH)", "Repetitive stress", "Osteoporosis"],
    "Foot/Ankle": ["High-impact activity", "Ankle sprain", "Stress fractures"],
    "Knee":       ["Osteoarthritis", "Sports injury", "Meniscal tears"],
    "Hip/Pelvis": ["Osteoporosis", "High-energy trauma", "Avascular necrosis"],
    "Spine":      ["Compression fractures", "Scoliosis", "Disc herniation"],
    "Shoulder":   ["Rotator cuff injury", "AC joint dislocation", "Impingement syndrome"],
    "Elbow":      ["Radial head fracture", "Olecranon fracture", "Lateral epicondylitis"],
    "Skull":      ["Head trauma", "Depressed fracture", "Suture diastasis"],
}

JOINT_NORM_ANGLES: Dict[str, Tuple[float, float]] = {
    "Knee":       (78.0, 102.0),
    "Elbow":      (65.0, 115.0),
    "Shoulder":   (30.0,  75.0),
    "Hip/Pelvis": (158.0, 180.0),
    "Foot/Ankle": (0.0,   50.0),
}


# ═══════════════════════════════════════════════════════════════
#  UTILITY HELPERS
# ═══════════════════════════════════════════════════════════════

def to_gray(img: np.ndarray) -> np.ndarray:
    """Convert any image array to uint8 grayscale."""
    if img is None:
        raise ValueError("Image array is None")
    # Convert to BGR first if multi-channel
    if len(img.shape) == 3:
        if img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    # Normalise to uint8 regardless of source dtype (16-bit, float, etc.)
    if gray.dtype != np.uint8:
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    return gray


def clahe(gray: np.ndarray, clip: float = 3.0) -> np.ndarray:
    """CLAHE enhancement — always returns uint8."""
    # Ensure uint8 input (cv2.CLAHE requires 8-bit or 16-bit; we use 8-bit)
    if gray.dtype != np.uint8:
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    result = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8)).apply(gray)
    return result


def safe_pct(arr: np.ndarray, pct: float) -> int:
    """
    Safe percentile → int.
    Prevents ValueError when numpy returns a byte-character scalar
    (e.g. numpy.uint8 'B') instead of a plain numeric type.
    """
    val = np.percentile(arr.astype(np.float32), pct)
    return int(max(0, min(255, float(val))))




def iou(b1: List[int], b2: List[int]) -> float:
    x1, y1 = max(b1[0], b2[0]), max(b1[1], b2[1])
    x2, y2 = min(b1[2], b2[2]), min(b1[3], b2[3])
    if x2 <= x1 or y2 <= y1:
        return 0.0
    inter = (x2 - x1) * (y2 - y1)
    a1 = (b1[2]-b1[0]) * (b1[3]-b1[1])
    a2 = (b2[2]-b2[0]) * (b2[3]-b2[1])
    return inter / (a1 + a2 - inter + 1e-8)


def nms(dets: List[Dict], thresh: float = 0.40) -> List[Dict]:
    if not dets:
        return []
    dets = sorted(dets, key=lambda d: d["confidence"], reverse=True)
    kept = []
    for d in dets:
        if not any(iou(d["location"], k["location"]) > thresh for k in kept):
            kept.append(d)
    return kept


def image_quality(gray: np.ndarray) -> Dict[str, Any]:
    h, w = gray.shape
    mean_b = float(np.mean(gray))
    std_b  = float(np.std(gray))
    ed     = float(np.count_nonzero(cv2.Canny(gray, 50, 150))) / (h * w)
    score  = (0.35 if 55 < mean_b < 205 else 0) + \
             (0.30 if std_b > 38 else 0) + \
             (0.35 if 0.03 < ed < 0.42 else 0)
    q = "good" if score >= 0.65 else "fair" if score >= 0.35 else "poor"
    return {"quality": q, "score": round(score, 2),
            "mean_brightness": round(mean_b, 1), "contrast_std": round(std_b, 1)}


# ═══════════════════════════════════════════════════════════════
#  BODY-PART DETECTION  v3  — robust heuristics + hard gates
# ═══════════════════════════════════════════════════════════════

def _bone_components(enh: np.ndarray, h: int, w: int):
    """Return bone mask, component stats, and size distribution."""
    _, mask = cv2.threshold(
        enh, safe_pct(enh, 72), 255, cv2.THRESH_BINARY)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)

    nl, _, stats, centroids = cv2.connectedComponentsWithStats(mask, 8)
    tp = h * w
    areas, cents = [], []
    for i in range(1, nl):
        a = stats[i, cv2.CC_STAT_AREA]
        if a > tp * 0.0018:
            areas.append(a)
            cents.append(centroids[i])

    dist = {
        "tiny":   sum(1 for a in areas if a < tp * 0.010),
        "small":  sum(1 for a in areas if tp*0.010 <= a < tp*0.040),
        "medium": sum(1 for a in areas if tp*0.040 <= a < tp*0.120),
        "large":  sum(1 for a in areas if a >= tp*0.120),
        "total":  len(areas),
        "max_r":  max(areas) / tp if areas else 0.0,
    }
    return mask, dist, cents


def _count_parallel_structures(enh: np.ndarray) -> int:
    """
    Count elongated parallel structures in the upper-half of the image.
    This reliably detects fingers (hand) and toes (foot).
    """
    h, w = enh.shape
    top = enh[:max(1, h // 2), :]
    col_means = np.mean(top.astype(float), axis=0)
    col_s = uniform_filter1d(col_means, size=max(3, w // 22))
    threshold = np.mean(col_s) * 1.04
    min_sep = max(w // 14, 8)

    peaks, in_peak, peak_start = [], False, 0
    for i in range(1, len(col_s)):
        if col_s[i] > threshold and not in_peak:
            in_peak, peak_start = True, i
        elif col_s[i] <= threshold and in_peak:
            pc = (peak_start + i) // 2
            if not peaks or (pc - peaks[-1]) >= min_sep:
                peaks.append(pc)
            in_peak = False
    return len(peaks)


def detect_body_part(image: np.ndarray) -> Tuple[str, float]:
    """
    Classify the X-ray body part using a cascaded feature system:
      1. Hard aspect-ratio gates  (strong rules that rule out body parts)
      2. Feature scoring          (positive evidence for each body part)
      3. Penalty terms            (punish contradictory evidence)
    Returns (body_part, confidence 0-1).
    """
    gray = to_gray(image)
    h, w = gray.shape
    ar   = w / h          # >1 = landscape, <1 = portrait

    enh  = clahe(gray, clip=2.0)
    tp   = h * w

    # ── Bone components ─────────────────────────────────────
    _, bdist, cents = _bone_components(enh, h, w)
    nb      = bdist["total"]
    n_tiny  = bdist["tiny"]
    n_small = bdist["small"]
    n_med   = bdist["medium"]
    n_large = bdist["large"]
    maxr    = bdist["max_r"]

    # ── Bilateral symmetry ───────────────────────────────────
    lw = w // 2
    L  = enh[:, :lw].astype(float)
    R  = cv2.flip(enh[:, lw: lw + lw], 1).astype(float)
    sym = (1.0 - np.mean(np.abs(L - R)) / 255.0) if L.shape == R.shape else 0.5

    # ── Edge density ─────────────────────────────────────────
    edges  = cv2.Canny(enh, 40, 120)
    edge_d = float(np.count_nonzero(edges)) / tp

    # ── Brightness zones ─────────────────────────────────────
    overall_b = float(np.mean(enh))
    top_b     = float(np.mean(enh[:h//3, :]))
    bot_b     = float(np.mean(enh[2*h//3:, :]))
    mid_b     = float(np.mean(enh[h//3:2*h//3, w//4:3*w//4]))
    center_b  = float(np.mean(enh[h//4:3*h//4, w//4:3*w//4]))
    col_b     = float(np.mean(enh[:, w//3:2*w//3]))
    periph_b  = float(np.mean(np.concatenate([enh[0,:], enh[-1,:],
                                               enh[:,0], enh[:,-1]])))

    # ── Horizontal periodicity (rib signature) ───────────────
    row_d = np.diff(np.mean(enh.astype(float), axis=1))
    zc    = float(np.sum(np.diff(np.sign(row_d)) != 0)) / h

    # ── Parallel structure count (fingers / toes) ────────────
    par_count = _count_parallel_structures(enh)

    # ════════════════════════════════════════════════════════
    #  SCORING  (each feature contributes to one body part)
    # ════════════════════════════════════════════════════════
    s: Dict[str, float] = {k: 0.0 for k in [
        "Hand/Wrist","Foot/Ankle","Knee","Hip/Pelvis",
        "Chest","Spine","Shoulder","Elbow","Skull"]}

    # ── HAND / WRIST ─────────────────────────────────────────
    # Must be portrait.  Has 15-30 small/medium bones.  3-6 finger peaks.
    h_s = 0.0
    if ar < 0.60:          h_s += 0.38   # Strong — clearly portrait
    elif ar < 0.72:        h_s += 0.24
    elif ar < 0.82:        h_s += 0.08
    else:                  h_s -= 0.25   # Hard penalty for landscape

    if 3 <= par_count <= 6:  h_s += 0.32  # Finger columns visible
    elif par_count == 2:     h_s += 0.10

    if nb >= 18:           h_s += 0.20
    elif nb >= 12:         h_s += 0.12
    elif nb >= 7:          h_s += 0.04

    if n_large == 0:       h_s += 0.06   # No single dominant bone
    if edge_d > 0.20:      h_s += 0.06
    if sym < 0.72:         h_s += 0.04   # Slightly asymmetric due to thumb
    s["Hand/Wrist"] = h_s

    # ── FOOT / ANKLE ─────────────────────────────────────────
    # Can be portrait or landscape.  Bottom half heavier (tarsals).
    # Toes visible in front (like fingers but heavier base).
    f_s = 0.0
    if 0.40 < ar < 0.78:   f_s += 0.16  # Portrait foot (lateral/PA)
    elif 0.78 <= ar < 1.6:  f_s += 0.20  # Landscape foot (AP/oblique)

    if 3 <= par_count <= 6:  f_s += 0.18  # Toe columns
    if nb >= 10:             f_s += 0.18
    if bot_b > top_b * 1.06: f_s += 0.26  # Tarsals heavier at bottom/back
    elif bot_b > top_b:      f_s += 0.10

    if n_large <= 1:     f_s += 0.08
    if sym < 0.70:       f_s += 0.08
    s["Foot/Ankle"] = f_s

    # ── KNEE ─────────────────────────────────────────────────
    # Roughly square.  2-4 large components.  Dark joint space gap.
    k_s = 0.0
    if 0.55 < ar < 1.30:   k_s += 0.20
    if 2 <= nb <= 5:       k_s += 0.26
    if mid_b < overall_b * 0.87:  k_s += 0.28  # Dark joint space
    if top_b > bot_b * 1.02:      k_s += 0.14  # Femur brighter
    if par_count <= 2:             k_s += 0.06
    if n_med + n_large >= 2 and (n_tiny + n_small) < 8: k_s += 0.10
    s["Knee"] = k_s

    # ── HIP / PELVIS ─────────────────────────────────────────
    # Must be WIDE landscape. High bilateral symmetry. Few large structures.
    p_s = 0.0
    if ar > 1.60:          p_s += 0.34   # Wide landscape — very strong signal
    elif ar > 1.40:        p_s += 0.22
    elif ar > 1.20:        p_s += 0.08
    elif ar < 0.85:        p_s -= 0.35   # Hard penalty for portrait — NOT pelvis

    if sym > 0.74:         p_s += 0.26
    elif sym > 0.67:       p_s += 0.12

    if 3 <= nb <= 8:       p_s += 0.20
    elif nb > 14:          p_s -= 0.18   # Penalty: pelvis has few components

    if n_large >= 1:       p_s += 0.14
    if par_count <= 2:     p_s += 0.06
    s["Hip/Pelvis"] = p_s

    # ── CHEST ─────────────────────────────────────────────────
    # Square to slight landscape. High symmetry. Rib periodicity. Central mass.
    c_s = 0.0
    if 0.85 < ar < 1.60:   c_s += 0.22
    elif 0.75 < ar <= 0.85: c_s += 0.08

    if sym > 0.74:         c_s += 0.28
    elif sym > 0.66:       c_s += 0.14

    if 0.12 < zc < 0.46:  c_s += 0.20  # Rib periodicity
    if center_b > overall_b * 1.08: c_s += 0.14  # Mediastinum bright

    if 3 <= nb <= 12:      c_s += 0.10
    if par_count <= 2:     c_s += 0.06
    s["Chest"] = c_s

    # ── SPINE ─────────────────────────────────────────────────
    # Very tall portrait.  Single bright central column.  Segmented.
    sp_s = 0.0
    if ar < 0.44:          sp_s += 0.36  # Very tall — strong signal
    elif ar < 0.55:        sp_s += 0.22
    elif ar < 0.65:        sp_s += 0.08
    else:                  sp_s -= 0.10

    if col_b > overall_b * 1.12:  sp_s += 0.26  # Bright central column
    elif col_b > overall_b * 1.06: sp_s += 0.12

    if 0.28 < zc < 0.62:  sp_s += 0.20  # Vertebral segmentation
    if 5 <= nb <= 20:      sp_s += 0.12
    if sym > 0.58:         sp_s += 0.06
    s["Spine"] = sp_s

    # ── SHOULDER ─────────────────────────────────────────────
    # Square to portrait. Asymmetric (one joint). 2-5 components.
    sh_s = 0.0
    if 0.45 < ar < 1.15:   sh_s += 0.22
    if sym < 0.64:         sh_s += 0.24  # Asymmetric
    elif sym < 0.70:       sh_s += 0.10

    if 2 <= nb <= 5:       sh_s += 0.26
    if 0.10 < edge_d < 0.26: sh_s += 0.18
    if par_count <= 1:     sh_s += 0.10
    s["Shoulder"] = sh_s

    # ── ELBOW ─────────────────────────────────────────────────
    # Portrait (0.35-0.90). 3 bone ends joining. Asymmetric.
    el_s = 0.0
    if 0.35 < ar < 0.90:   el_s += 0.24
    elif ar < 1.10:        el_s += 0.08

    if 3 <= nb <= 7:       el_s += 0.32
    if sym < 0.68:         el_s += 0.22
    elif sym < 0.74:       el_s += 0.08

    if 0.10 < edge_d < 0.28: el_s += 0.14
    if par_count <= 1:     el_s += 0.08
    s["Elbow"] = el_s

    # ── SKULL ────────────────────────────────────────────────
    # Oval/round. Dense peripheral ring (calvarium). Few components.
    sk_s = 0.0
    if 0.72 < ar < 1.30:   sk_s += 0.22
    if 1 <= nb <= 4:       sk_s += 0.28
    if periph_b > overall_b * 1.06: sk_s += 0.28
    if sym > 0.68:         sk_s += 0.17
    if par_count <= 1:     sk_s += 0.05
    s["Skull"] = sk_s

    # ── Winner ───────────────────────────────────────────────
    best      = max(s, key=s.get)
    best_score = s[best]
    confidence = round(min(0.96, max(0.0, best_score) / 0.80), 2)

    if confidence < 0.20:
        return "Unknown", 0.30

    logger.info(f"Body part scores: {s}")
    logger.info(f"Winner: {best}  score={best_score:.2f}  conf={confidence:.2f}  "
                f"ar={ar:.2f}  nb={nb}  par_count={par_count}  sym={sym:.2f}")
    return best, confidence


# ═══════════════════════════════════════════════════════════════
#  FRACTURE DETECTION  — 3-method consensus
# ═══════════════════════════════════════════════════════════════

def _method_cortical(enh: np.ndarray) -> List[Dict]:
    h, w = enh.shape
    _, bone_mask = cv2.threshold(enh, safe_pct(enh, 68), 255, cv2.THRESH_BINARY)
    edges = cv2.Canny(cv2.GaussianBlur(enh, (3, 3), 0), 50, 150)
    cortical = cv2.bitwise_and(edges, bone_mask)
    cnts, _ = cv2.findContours(bone_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    dets = []
    for cnt in cnts:
        if cv2.contourArea(cnt) < h * w * 0.015:
            continue
        roi_c = cv2.bitwise_and(cortical, cv2.drawContours(
            np.zeros_like(enh), [cnt], -1, 255, -1))
        lines = cv2.HoughLinesP(roi_c, 1, math.pi / 180,
                                threshold=12, minLineLength=18, maxLineGap=10)
        if lines is None:
            continue
        for ln in lines:
            x1, y1, x2, y2 = ln[0]
            length = math.hypot(x2-x1, y2-y1)
            angle  = abs(math.degrees(math.atan2(y2-y1, x2-x1)))
            if length < 18 or not (16 < angle < 164):
                continue
            mx, my = (x1+x2)//2, (y1+y2)//2
            if not (0 <= my < h and 0 <= mx < w):
                continue
            if np.mean(enh[max(0,my-12):min(h,my+12),
                           max(0,mx-12):min(w,mx+12)]) < 110:
                continue
            dets.append({
                "location": [x1, y1, x2, y2],
                "confidence": round(min(0.84, 0.44 + length / max(h, w) * 0.55), 2),
                "method": "cortical",
            })
    return dets


def _method_texture(enh: np.ndarray) -> List[Dict]:
    h, w = enh.shape
    dets = []
    try:
        from skimage.feature import graycomatrix, graycoprops
    except ImportError:
        return dets
    sy = max(h // 7, 20)
    sx = max(w // 7, 20)
    bone_t = safe_pct(enh, 65)
    for py in range(0, h - sy, sy // 2):
        for px in range(0, w - sx, sx // 2):
            patch = enh[py:py+sy, px:px+sx]
            if np.mean(patch) < bone_t:
                continue
            try:
                glcm = graycomatrix(patch, [1],
                                    [0, math.pi/4, math.pi/2, 3*math.pi/4],
                                    symmetric=True, normed=True)
                contrast = float(graycoprops(glcm, "contrast").mean())
                energy   = float(graycoprops(glcm, "energy").mean())
            except Exception:
                continue
            if contrast > 420 and energy < 0.07:
                conf = min(0.78, 0.36 + contrast / 6000)
                dets.append({"location": [px, py, px+sx, py+sy],
                              "confidence": round(conf, 2), "method": "texture"})
    return dets


def _method_gradient(enh: np.ndarray) -> List[Dict]:
    h, w = enh.shape
    sx_ = cv2.Sobel(enh, cv2.CV_64F, 1, 0, ksize=3)
    sy_ = cv2.Sobel(enh, cv2.CV_64F, 0, 1, ksize=3)
    mag = np.sqrt(sx_**2 + sy_**2)
    mag = ((mag / (mag.max() + 1e-8)) * 255).astype(np.uint8)
    _, bone_mask = cv2.threshold(enh, safe_pct(enh, 65), 255, cv2.THRESH_BINARY)
    grad_bone    = cv2.bitwise_and(mag, bone_mask)
    _, hg = cv2.threshold(grad_bone, 168, 255, cv2.THRESH_BINARY)
    hg    = cv2.morphologyEx(hg, cv2.MORPH_CLOSE, np.ones((3,3), np.uint8))
    cnts, _ = cv2.findContours(hg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    dets = []
    for cnt in cnts:
        area = cv2.contourArea(cnt)
        if area < 40 or area > h * w * 0.18:
            continue
        x, y, cw, ch = cv2.boundingRect(cnt)
        if max(cw, ch) / (min(cw, ch) + 1) < 1.8:
            continue
        dets.append({"location": [x, y, x+cw, y+ch],
                     "confidence": round(min(0.74, 0.33 + area / (h*w) * 12), 2),
                     "method": "gradient"})
    return dets


def detect_fractures_consensus(image: np.ndarray, body_part: str = "") -> List[Dict]:
    gray = to_gray(image)
    h, w = gray.shape
    enh  = clahe(gray, clip=3.0)

    allm = (_method_cortical(enh) +
            _method_texture(enh) +
            _method_gradient(enh))
    if not allm:
        return []

    GRID = 8
    ch_, cw_ = max(1, h // GRID), max(1, w // GRID)
    midx = {"cortical": 0, "texture": 1, "gradient": 2}
    votes = np.zeros((GRID, GRID, 3), float)

    for d in allm:
        loc = d["location"]
        cx, cy = (loc[0]+loc[2])//2, (loc[1]+loc[3])//2
        gx = min(GRID-1, cx // cw_)
        gy = min(GRID-1, cy // ch_)
        mi = midx[d["method"]]
        votes[gy, gx, mi] = max(votes[gy, gx, mi], d["confidence"])

    mc = np.sum(votes > 0, axis=2)
    findings = []
    for gy in range(GRID):
        for gx in range(GRID):
            if mc[gy, gx] < 2:
                continue
            active = votes[gy, gx, votes[gy, gx] > 0]
            avg    = float(np.mean(active))
            nm     = int(mc[gy, gx])
            boost  = 0.08 if nm == 3 else 0.0
            conf   = round(min(0.93, avg * 1.12 + boost), 2)
            sev    = "severe" if conf > 0.75 else "moderate" if conf > 0.55 else "mild"
            findings.append({
                "label":           "Fracture",
                "confidence":       conf,
                "severity":         sev,
                "location":        [gx*cw_, gy*ch_, (gx+1)*cw_, (gy+1)*ch_],
                "methods_agreed":   nm,
                "description":     _fracture_desc(sev, body_part),
            })

    return nms(findings, thresh=0.35)


def _fracture_desc(severity: str, body_part: str) -> str:
    specific = {
        "Hand/Wrist": "Cortical interruption in hand/wrist bones. Boxer's fracture, Bennett's fracture, and Colles' fracture are common patterns.",
        "Foot/Ankle": "Bone discontinuity in foot/ankle. Stress fractures of metatarsals and avulsion fractures at malleoli are common.",
        "Knee":  "Cortical break detected at knee. Tibial plateau and patella fractures are critical — weight-bearing must be avoided.",
        "Hip/Pelvis": "Pelvic/femoral cortical interruption. Hip fractures in this region can be limb-threatening and require urgent care.",
        "Spine": "Vertebral cortical disruption detected. Compression fractures and burst fractures require immediate spinal precautions.",
        "Shoulder": "Cortical break at shoulder. Proximal humerus and clavicle fractures are most common in this region.",
        "Elbow": "Bone disruption at elbow joint. Radial head and olecranon fractures may cause neurovascular compromise.",
        "Skull": "Cranial cortical interruption. Linear, depressed, and basilar skull fractures require urgent neurological evaluation.",
    }
    base = specific.get(body_part,
                        "Cortical bone interruption consistent with fracture. Orthopedic evaluation required.")
    return base


# ═══════════════════════════════════════════════════════════════
#  DISLOCATION DETECTION  — joint-axis & space analysis
# ═══════════════════════════════════════════════════════════════

def detect_dislocation(image: np.ndarray, body_part: str) -> List[Dict]:
    if body_part not in JOINT_NORM_ANGLES:
        return []

    gray = to_gray(image)
    h, w = gray.shape
    enh  = clahe(gray, clip=2.0)
    _, mask = cv2.threshold(enh, safe_pct(enh, 72), 255, cv2.THRESH_BINARY)
    k7 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7,7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k7)

    nl, _, stats, centroids = cv2.connectedComponentsWithStats(mask, 8)
    sig = sorted(
        [(i, stats[i], centroids[i]) for i in range(1, nl)
         if stats[i, cv2.CC_STAT_AREA] > h*w*0.025],
        key=lambda x: x[1][cv2.CC_STAT_AREA], reverse=True)

    if len(sig) < 2:
        return []

    c1, c2 = sig[0][2], sig[1][2]
    dx, dy = c2[0]-c1[0], c2[1]-c1[1]
    angle  = abs(math.degrees(math.atan2(dy, dx)))
    lo, hi = JOINT_NORM_ANGLES[body_part]
    if lo <= angle <= hi:
        return []

    dev = min(abs(angle-lo), abs(angle-hi))
    conf = round(min(0.86, 0.40 + dev / 90.0 * 0.44), 2)
    if conf < 0.44:
        return []

    mx, my = int((c1[0]+c2[0])/2), int((c1[1]+c2[1])/2)
    sz = int(min(h,w) * 0.16)
    return [{
        "label":      "Dislocation",
        "confidence":  conf,
        "severity":   "severe" if conf > 0.70 else "moderate",
        "location":   [max(0,mx-sz), max(0,my-sz), min(w,mx+sz), min(h,my+sz)],
        "description": (
            f"Joint axis angle {angle:.1f}° deviates from anatomical norm "
            f"({lo:.0f}–{hi:.0f}°) for {body_part}. "
            "Possible dislocation — immediate clinical assessment advised."
        ),
    }]


# ═══════════════════════════════════════════════════════════════
#  BONE WEAR & DEGENERATION DETECTION
# ═══════════════════════════════════════════════════════════════

def detect_bone_wear(image: np.ndarray, body_part: str) -> List[Dict]:
    """
    Detect degenerative bone changes:
     • Reduced bone density (low brightness in bone regions)
     • Joint space narrowing (osteoarthritis signature)
    """
    JOINT_PARTS = {"Knee","Hip/Pelvis","Shoulder","Elbow",
                   "Hand/Wrist","Foot/Ankle","Spine"}
    if body_part not in JOINT_PARTS:
        return []

    gray = to_gray(image)
    h, w = gray.shape
    enh  = clahe(gray, clip=2.0)
    findings = []

    # ── 1. Bone density estimate ─────────────────────────────
    _, bone_mask = cv2.threshold(enh, safe_pct(enh, 70), 255, cv2.THRESH_BINARY)
    bone_pixels  = enh[bone_mask > 0]
    if len(bone_pixels) > 100:
        bone_mean = float(np.mean(bone_pixels))
        if bone_mean < 165:
            conf = round(min(0.74, 0.35 + (165 - bone_mean) / 165 * 0.42), 2)
            if conf >= 0.40:
                findings.append({
                    "label":       "Possible Reduced Bone Density",
                    "confidence":   conf,
                    "severity":    "moderate" if conf > 0.56 else "mild",
                    "location":    "Bone regions overall",
                    "description": (
                        f"Mean bone brightness ({bone_mean:.0f}) suggests possible reduced "
                        "mineralisation. Clinical correlation and DEXA scan may be warranted "
                        "to rule out osteopenia or osteoporosis."
                    ),
                })

    # ── 2. Joint space narrowing ─────────────────────────────
    if body_part in {"Knee", "Hip/Pelvis", "Elbow", "Shoulder"}:
        row_means = np.mean(enh.astype(float), axis=1)
        mid       = row_means[h//4 : 3*h//4]
        dark_t    = float(np.percentile(row_means, 30))
        bone_t    = float(np.percentile(row_means, 72))

        narrow_rows = float(np.sum(mid < dark_t))
        mi = int(np.argmin(mid))

        top_ok = mid[max(0, mi-6)] > bone_t
        bot_ok = mid[min(len(mid)-1, mi+6)] > bone_t

        if narrow_rows < h * 0.025 and top_ok and bot_ok:
            conf = round(min(0.80, 0.40 + (1 - narrow_rows / max(1, h*0.05)) * 0.38), 2)
            if conf >= 0.42:
                findings.append({
                    "label":       "Possible Joint Space Narrowing",
                    "confidence":   conf,
                    "severity":    "moderate" if conf > 0.60 else "mild",
                    "location":    f"{body_part} joint area",
                    "description": (
                        "Reduced visible joint space width detected. "
                        "This pattern is consistent with degenerative joint disease "
                        "(osteoarthritis). Weight-bearing views and clinical correlation recommended."
                    ),
                })

    # ── 3. Texture irregularity (subchondral sclerosis) ──────
    if body_part in {"Knee", "Hip/Pelvis"}:
        roi = enh[h//4:3*h//4, w//4:3*w//4]
        local_std = float(np.std(roi.astype(float)))
        if local_std > 62:  # High variance in joint region
            conf = round(min(0.68, 0.32 + (local_std - 62) / 100 * 0.36), 2)
            if conf >= 0.42:
                findings.append({
                    "label":       "Irregular Bone Texture",
                    "confidence":   conf,
                    "severity":    "mild",
                    "location":    f"{body_part} articular surface",
                    "description": (
                        "High texture variance in joint region may suggest "
                        "subchondral sclerosis, osteophyte formation, or other "
                        "degenerative surface changes. Radiologist review advised."
                    ),
                })

    return findings


# ═══════════════════════════════════════════════════════════════
#  CHEST PATHOLOGY  — torchxrayvision
# ═══════════════════════════════════════════════════════════════

def analyze_chest_pathology(image: np.ndarray) -> List[Dict]:
    if chest_model is None:
        return []
    try:
        import torchxrayvision as xrv
        gray     = to_gray(image).astype(np.float32)
        img_norm = xrv.datasets.normalize(gray, 255)
        tensor   = torch.from_numpy(img_norm).unsqueeze(0).unsqueeze(0)
        tensor   = transforms.Resize(224, antialias=True)(tensor).to(device)
        with torch.no_grad():
            preds = chest_model(tensor)
        probs = torch.sigmoid(preds[0]).cpu().numpy()
        out = []
        for i, path in enumerate(chest_model.pathologies):
            if path is None:
                continue
            conf = float(probs[i])
            if conf < 0.38:
                continue
            sev = "severe" if conf > 0.75 else "moderate" if conf > 0.55 else "mild"
            out.append({
                "label":       path,
                "confidence":  round(conf, 2),
                "severity":    sev,
                "location":    "Chest / Lung fields",
                "description": PATHOLOGY_DESC.get(path,
                    "Radiological finding detected — clinical correlation required"),
            })
        return sorted(out, key=lambda x: x["confidence"], reverse=True)
    except Exception as e:
        logger.error(f"Chest analysis error: {e}")
        return []


# ═══════════════════════════════════════════════════════════════
#  CLINICAL REPORT GENERATOR  (rule-based, no LLM)
# ═══════════════════════════════════════════════════════════════

def build_clinical_report(
        body_part: str,
        fracs: List[Dict],
        dislos: List[Dict],
        wear: List[Dict],
        chest: List[Dict]) -> Dict[str, Any]:

    all_f    = fracs + dislos + wear + chest
    urgent   = any(f["severity"] == "severe" for f in all_f)
    moderate = any(f["severity"] == "moderate" for f in all_f) and not urgent

    # ── Summary ─────────────────────────────────────────────
    if not all_f:
        summary = (
            f"No significant radiological abnormalities detected in the {body_part} X-ray. "
            "Bone cortex, alignment, and visible joint spaces appear within normal limits "
            "for this view. Routine clinical follow-up is advised."
        )
    elif fracs:
        n   = len(fracs)
        top = fracs[0]
        summary = (
            f"Analysis of the {body_part} X-ray identified {n} potential "
            f"fracture site{'s' if n > 1 else ''} "
            f"(highest confidence: {top['confidence']:.0%}). "
            f"{top['description'].split('.')[0]}. "
        )
        if dislos:
            summary += "Joint malalignment was also flagged. "
        if urgent:
            summary += "Urgent orthopaedic evaluation is strongly recommended."
        else:
            summary += "Medical evaluation is advised."
    elif dislos:
        top = dislos[0]
        summary = (
            f"Joint axis malalignment detected in {body_part} "
            f"({top['confidence']:.0%} confidence). "
            f"{top['description']} "
            "Immediate clinical assessment is required."
        )
    elif wear:
        summary = (
            f"{body_part} X-ray shows signs of degenerative bone changes. "
            f"{wear[0]['description']} "
            "Clinical correlation with symptoms and history is recommended."
        )
    elif chest:
        top = chest[0]
        summary = (
            f"Chest X-ray findings suggest possible {top['label']} "
            f"({top['confidence']:.0%} confidence). "
            "Further clinical and laboratory workup is recommended."
        )
    else:
        summary = f"Minor findings in {body_part} X-ray. Clinical correlation advised."

    # ── Recommendations ──────────────────────────────────────
    recs: List[str] = []
    if fracs:
        recs += [
            "Seek immediate orthopaedic evaluation",
            "Immobilise the affected area pending assessment",
            "Avoid weight-bearing on the affected limb",
            "Adequate analgesia under medical supervision",
            "CT or MRI may be required for fracture characterisation",
        ]
    if dislos:
        recs += [
            "Do NOT attempt self-reduction",
            "Immobilise the joint in the position of comfort",
            "Attend the nearest emergency department immediately",
        ]
    if wear:
        recs += [
            "Physiotherapy assessment for joint rehabilitation",
            "DEXA scan may be warranted if osteoporosis suspected",
            "Anti-inflammatory management under medical supervision",
            "Discuss joint replacement options with orthopaedic surgeon if severe",
        ]
    if chest:
        for f in chest:
            if f["label"] == "Pneumothorax" and f["severity"] == "severe":
                recs.insert(0, "⚠️ URGENT: Possible pneumothorax — seek emergency care immediately")
            if f["label"] == "Cardiomegaly":
                recs.append("Cardiology consultation recommended")
            if f["label"] == "Pneumonia":
                recs.append("Correlate with clinical symptoms, fever, and CRP/WBC counts")
        recs.append("Compare with previous chest X-rays where available")
        recs.append("Pulmonology or internal medicine follow-up")

    if not recs:
        recs = [
            "No acute intervention required at this time",
            "Routine follow-up with primary care physician",
            "Repeat imaging only if symptoms develop or worsen",
        ]
    recs.append(
        "⚕️ This AI-assisted analysis must be reviewed by a qualified "
        "radiologist or physician before clinical decisions are made"
    )

    return {
        "summary":         summary,
        "recommendations": recs,
        "urgent":          urgent,
        "monitor":         moderate,
    }


# ═══════════════════════════════════════════════════════════════
#  ANNOTATION
# ═══════════════════════════════════════════════════════════════

_SEV_BGR = {
    "severe":   (38,  38, 220),
    "moderate": (8,  179, 234),
    "mild":     (94, 197,  34),
}

def annotate(image: np.ndarray, findings: List[Dict]) -> np.ndarray:
    ann = image.copy()
    if len(ann.shape) == 2:
        ann = cv2.cvtColor(ann, cv2.COLOR_GRAY2BGR)
    for f in findings:
        loc = f.get("location", [])
        if len(loc) < 4:
            continue
        x1,y1,x2,y2 = int(loc[0]),int(loc[1]),int(loc[2]),int(loc[3])
        bgr = _SEV_BGR.get(f.get("severity","mild"), (94,197,34))
        th  = 3 if f.get("severity") == "severe" else 2
        cv2.rectangle(ann, (x1,y1), (x2,y2), bgr, th)
        txt = f"{f['label']}  {f['confidence']:.0%}"
        fs, ft = 0.46, 1
        (tw,th2), _ = cv2.getTextSize(txt, cv2.FONT_HERSHEY_SIMPLEX, fs, ft)
        by = max(y1-6, th2+4)
        cv2.rectangle(ann, (x1, by-th2-4), (x1+tw+4, by+2), bgr, -1)
        cv2.putText(ann, txt, (x1+2, by-2),
                    cv2.FONT_HERSHEY_SIMPLEX, fs, (255,255,255), ft)
    return ann


# ═══════════════════════════════════════════════════════════════
#  API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {"message": "X-Ray Analyzer – Local ML v3",
            "version": "3.0.0", "chest_model": chest_model is not None}

@app.get("/health")
async def health():
    return {
        "status": "healthy", "version": "3.0.0",
        "device": str(device),
        "chest_model_loaded": chest_model is not None,
        "methods": [
            "body_part_detection_v3",
            "cortical_interruption",
            "texture_entropy_glcm",
            "gradient_magnitude",
            "dislocation_axis_alignment",
            "bone_wear_density",
            "chest_pathology_torchxrayvision",
        ],
    }


@app.post("/analyze-xray")
async def analyze_xray(file: UploadFile = File(...)):
    # Accept any image content-type (some browsers send application/octet-stream)
    try:
        raw = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read upload: {e}")

    # ── Image pre-processing (hardened) ─────────────────────────────────
    try:
        pil_img = Image.open(io.BytesIO(raw))

        # Fix EXIF orientation (iPhone photos, etc.)
        try:
            from PIL import ImageOps
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception:
            pass

        # Normalise mode → RGB  (handles L, RGBA, P, CMYK, …)
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        # Resize very large images (preserve aspect ratio, max 1024 px)
        w0, h0 = pil_img.size
        if max(w0, h0) > 1024:
            scale   = 1024 / max(w0, h0)
            pil_img = pil_img.resize(
                (max(1, int(w0 * scale)), max(1, int(h0 * scale))),
                Image.LANCZOS)

        image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        if image.shape[0] < 64 or image.shape[1] < 64:
            raise HTTPException(status_code=422,
                                detail="Image too small — minimum 64×64 px")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422,
                            detail=f"Cannot decode image ({type(e).__name__}): {e}")

    # ── Run analysis pipeline ────────────────────────────────────────────
    try:
        gray    = to_gray(image)
        quality = image_quality(gray)

        body_part, bp_conf = detect_body_part(image)
        logger.info(f"→ {body_part}  ({bp_conf:.0%})")

        fracs  = detect_fractures_consensus(image, body_part)
        dislos = detect_dislocation(image, body_part)
        wear   = detect_bone_wear(image, body_part)

        chest: List[Dict] = []
        if body_part in ("Chest", "Unknown") and chest_model is not None:
            chest = analyze_chest_pathology(image)

        all_f  = fracs + dislos + wear + chest
        report = build_clinical_report(body_part, fracs, dislos, wear, chest)

        ann_bgr = annotate(image, all_f)
        ann_rgb = cv2.cvtColor(ann_bgr, cv2.COLOR_BGR2RGB)
        buf2    = io.BytesIO()
        Image.fromarray(ann_rgb).save(buf2, format="PNG")
        ann_b64 = base64.b64encode(buf2.getvalue()).decode()

        return JSONResponse(content={
            "body_part":            body_part,
            "body_part_confidence": bp_conf,
            "image_quality":        quality,
            "findings": {
                "fractures":       fracs,
                "dislocations":    dislos,
                "bone_wear":       wear,
                "chest_pathology": chest,
            },
            "all_findings_count": len(all_f),
            "clinical_report":    report,
            "risk_factors":       BODY_PART_RISK_FACTORS.get(body_part, []),
            "annotated_image":    f"data:image/png;base64,{ann_b64}",
            "disclaimer": (
                "AI-assisted screening tool using computer vision only. "
                "Does NOT replace professional radiological or medical evaluation. "
                "Always consult a qualified physician or radiologist before "
                "making any clinical decisions."
            ),
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(
            status_code=422,
            detail=f"Analysis failed ({type(e).__name__}): {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


