from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Telegram configuration
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')

# LLM configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Google Places API
GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')

# Admin password
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# Load attractions data for AI context
ATTRACTIONS_FILE = ROOT_DIR.parent / 'frontend' / 'src' / 'data' / 'attractions.json'
ATTRACTIONS_DATA = []
if ATTRACTIONS_FILE.exists():
    with open(ATTRACTIONS_FILE, 'r', encoding='utf-8') as f:
        ATTRACTIONS_DATA = json.load(f)

# Load districts data
DISTRICTS_FILE = ROOT_DIR.parent / 'frontend' / 'src' / 'data' / 'districts.js'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# Contact Form Models
class ContactFormCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class ContactForm(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False


# Review Models
class ReviewCreate(BaseModel):
    author_name: str
    location: Optional[str] = None
    text: str
    rating: int = Field(ge=1, le=5)

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_name: str
    location: Optional[str] = None
    text: str


# AI Chat Models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str


# Trip Planner Models
class TripPlace(BaseModel):
    place_id: str
    name: str
    address: Optional[str] = None
    coordinates: Dict[str, float]
    category: Optional[str] = None
    order: int = 0

class TripPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    places: List[TripPlace] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_distance: Optional[float] = None
    estimated_time: Optional[str] = None

class TripPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    places: List[TripPlace] = []


# Feedback/Complaint Models
class FeedbackCreate(BaseModel):
    place_id: Optional[str] = None
    place_name: Optional[str] = None
    feedback_type: str  # 'complaint', 'suggestion', 'review'
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    rating: Optional[int] = None

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    place_id: Optional[str] = None
    place_name: Optional[str] = None
    feedback_type: str
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    rating: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "new"  # new, reviewed, resolved


# Place Edit Models (for admin)
class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    workingHours: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    photos: Optional[List[str]] = None
    category: Optional[str] = None


# Admin auth helper
async def verify_admin(authorization: str = Header(None)):
    if not authorization or authorization != f"Bearer {ADMIN_PASSWORD}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Contact Form Endpoints
async def send_telegram_notification(name: str, email: str, phone: str, message: str):
    """Send Telegram notification for new contact form submission"""
    try:
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            logger.warning("Telegram not configured, skipping notification")
            return
        
        # Format message for Telegram
        telegram_message = f"""📩 <b>Нове повідомлення з сайту!</b>

👤 <b>Ім'я:</b> {name}
📧 <b>Email:</b> {email}
📱 <b>Телефон:</b> {phone or 'Не вказано'}

💬 <b>Повідомлення:</b>
{message}

🕐 {datetime.now().strftime('%d.%m.%Y о %H:%M')}
"""
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": telegram_message,
                "parse_mode": "HTML"
            })
            
            if response.status_code == 200:
                logger.info("Telegram notification sent successfully")
            else:
                logger.error(f"Telegram error: {response.text}")
                
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {str(e)}")


@api_router.post("/contact", response_model=ContactForm)
async def create_contact_message(input: ContactFormCreate, background_tasks: BackgroundTasks):
    """Submit a contact form message"""
    contact_dict = input.model_dump()
    contact_obj = ContactForm(**contact_dict)
    
    doc = contact_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.contact_messages.insert_one(doc)
    logger.info(f"New contact message from {input.email}")
    
    # Send Telegram notification
    await send_telegram_notification(
        input.name,
        input.email,
        input.phone or "",
        input.message
    )
    
    return contact_obj


@api_router.get("/contact", response_model=List[ContactForm])
async def get_contact_messages():
    """Get all contact messages (for admin)"""
    messages = await db.contact_messages.find({}, {"_id": 0}).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    return messages


# Reviews Endpoints
@api_router.post("/reviews", response_model=Review)
async def create_review(input: ReviewCreate):
    """Submit a new review"""
    review_dict = input.model_dump()
    review_obj = Review(**review_dict)
    
    doc = review_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.reviews.insert_one(doc)
    logger.info(f"New review from {input.author_name}")
    
    return review_obj


@api_router.get("/reviews", response_model=List[Review])
async def get_reviews(approved_only: bool = True):
    """Get reviews (optionally only approved ones)"""
    query = {"is_approved": True} if approved_only else {}
    reviews = await db.reviews.find(query, {"_id": 0}).to_list(100)
    
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    
    return reviews


# AI Chat Endpoints
def get_system_prompt():
    """Generate system prompt with all attractions context"""
    # Group all attractions by category
    categories = {
        'historical': [],
        'parks': [],
        'shopping': [],
        'culture': [],
        'nature': [],
        'gastro': [],
        'hotels': []
    }
    
    for attr in ATTRACTIONS_DATA:
        cat = attr.get('category', 'other')
        if cat in categories:
            categories[cat].append({
                'name': attr.get('name'),
                'address': attr.get('address'),
                'workingHours': attr.get('workingHours'),
                'phone': attr.get('phone'),
                'website': attr.get('website')
            })
    
    # Create summary with counts and examples
    summary_parts = []
    for cat, items in categories.items():
        cat_names = {
            'historical': "Історичні пам'ятки",
            'parks': 'Парки та сквери',
            'shopping': 'Торгівельні центри',
            'culture': 'Культурні заклади',
            'nature': "Природні об'єкти",
            'gastro': 'Гастрономія',
            'hotels': 'Готелі'
        }
        summary_parts.append(f"\n### {cat_names.get(cat, cat)} ({len(items)} об'єктів):")
        # Include all items with names
        for item in items[:50]:  # Top 50 per category
            info = f"- {item['name']}"
            if item.get('address') and item['address'] != 'Житомирська область':
                info += f" ({item['address']})"
            if item.get('workingHours'):
                info += f" - {item['workingHours']}"
            summary_parts.append(info)
    
    attractions_context = '\n'.join(summary_parts)
    
    total_count = len(ATTRACTIONS_DATA)
    
    return f"""Ти - дружній помічник туристичного сайту Житомирської громади. Твоя задача - допомагати туристам знаходити цікаві місця для відвідування.

Ти маєш повний доступ до бази даних з {total_count} туристичних об'єктів Житомирщини.

{attractions_context}

Інструкції:
1. Відповідай українською мовою
2. Будь дружнім та привітним
3. Рекомендуй конкретні місця з бази даних з адресами та годинами роботи
4. Якщо турист не знає що хоче - запитай про його інтереси (історія, природа, їжа, шопінг тощо)
5. Давай практичну інформацію: адреси, години роботи, телефони якщо є
6. Якщо питання не стосується туризму - ввічливо поверни розмову до туристичної тематики
7. Відповідай стисло але інформативно (2-4 рекомендації за раз)
8. Можеш пропонувати маршрути та комбінації місць для відвідування
9. НЕ використовуй символи ** для виділення тексту - пиши простим текстом без markdown форматування
10. Використовуй емодзі для візуального оформлення списків замість **"""


# Store chat instances per session
chat_sessions = {}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """Chat with AI assistant about tourist places"""
    try:
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="AI not configured")
        
        # Generate or use existing session ID
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get or create chat instance for this session
        if session_id not in chat_sessions:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=get_system_prompt()
            ).with_model("anthropic", "claude-4-sonnet-20250514")
            chat_sessions[session_id] = chat
        else:
            chat = chat_sessions[session_id]
        
        # Store user message in DB
        user_msg = {
            "session_id": session_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(user_msg)
        
        # Send message to AI
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Store assistant response in DB
        assistant_msg = {
            "session_id": session_id,
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(assistant_msg)
        
        logger.info(f"AI chat response for session {session_id}")
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI помічник тимчасово недоступний: {str(e)}")


@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_history.find(
        {"session_id": session_id}, 
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return messages


# ============= TRIP PLANNER ENDPOINTS =============

@api_router.post("/trips", response_model=TripPlan)
async def create_trip(trip: TripPlanCreate):
    """Create a new trip plan"""
    trip_obj = TripPlan(**trip.model_dump())
    doc = trip_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.trips.insert_one(doc)
    logger.info(f"New trip created: {trip_obj.name}")
    return trip_obj


@api_router.get("/trips", response_model=List[TripPlan])
async def get_trips():
    """Get all trip plans"""
    trips = await db.trips.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return trips


@api_router.get("/trips/{trip_id}", response_model=TripPlan)
async def get_trip(trip_id: str):
    """Get a specific trip plan"""
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@api_router.put("/trips/{trip_id}", response_model=TripPlan)
async def update_trip(trip_id: str, trip: TripPlanCreate):
    """Update a trip plan"""
    existing = await db.trips.find_one({"id": trip_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    update_data = trip.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.trips.update_one({"id": trip_id}, {"$set": update_data})
    
    updated = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    return updated


@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str):
    """Delete a trip plan"""
    result = await db.trips.delete_one({"id": trip_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted successfully"}


# ============= FEEDBACK/COMPLAINTS ENDPOINTS =============

@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(feedback: FeedbackCreate, background_tasks: BackgroundTasks):
    """Submit feedback, complaint or suggestion"""
    feedback_obj = Feedback(**feedback.model_dump())
    doc = feedback_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.feedback.insert_one(doc)
    logger.info(f"New feedback from {feedback.email}: {feedback.feedback_type}")
    
    # Send Telegram notification
    feedback_type_names = {
        'complaint': 'Скарга',
        'suggestion': 'Побажання', 
        'review': 'Відгук'
    }
    
    telegram_message = f"""📋 <b>Новий {feedback_type_names.get(feedback.feedback_type, 'відгук')}!</b>

👤 <b>Від:</b> {feedback.name}
📧 <b>Email:</b> {feedback.email}
📱 <b>Телефон:</b> {feedback.phone or 'Не вказано'}
"""
    if feedback.place_name:
        telegram_message += f"📍 <b>Об'єкт:</b> {feedback.place_name}\n"
    if feedback.rating:
        telegram_message += f"⭐ <b>Оцінка:</b> {feedback.rating}/5\n"
    
    telegram_message += f"""
💬 <b>Повідомлення:</b>
{feedback.message}

🕐 {datetime.now().strftime('%d.%m.%Y о %H:%M')}
"""
    
    # Send to Telegram in background
    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        background_tasks.add_task(send_telegram_message, telegram_message)
    
    return feedback_obj


async def send_telegram_message(message: str):
    """Helper to send Telegram message"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            await client.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            })
    except Exception as e:
        logger.error(f"Failed to send Telegram: {e}")


@api_router.get("/feedback", response_model=List[Feedback])
async def get_feedback(status: Optional[str] = None, admin: bool = Depends(verify_admin)):
    """Get all feedback (admin only)"""
    query = {"status": status} if status else {}
    feedback_list = await db.feedback.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return feedback_list


@api_router.put("/feedback/{feedback_id}/status")
async def update_feedback_status(feedback_id: str, status: str, admin: bool = Depends(verify_admin)):
    """Update feedback status (admin only)"""
    result = await db.feedback.update_one(
        {"id": feedback_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {"message": "Status updated"}


# ============= GOOGLE PLACES API ENDPOINTS =============

@api_router.get("/places/details/{place_name}")
async def get_place_details(place_name: str):
    """Get place details from Google Places API"""
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # First, search for the place
            search_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
            search_params = {
                "input": f"{place_name} Житомир",
                "inputtype": "textquery",
                "fields": "place_id,name,formatted_address",
                "key": GOOGLE_PLACES_API_KEY
            }
            search_response = await client.get(search_url, params=search_params)
            search_data = search_response.json()
            
            if not search_data.get("candidates"):
                return {"error": "Place not found"}
            
            place_id = search_data["candidates"][0]["place_id"]
            
            # Get detailed info
            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            details_params = {
                "place_id": place_id,
                "fields": "name,formatted_address,formatted_phone_number,opening_hours,rating,reviews,photos,website,url",
                "language": "uk",
                "key": GOOGLE_PLACES_API_KEY
            }
            details_response = await client.get(details_url, params=details_params)
            details_data = details_response.json()
            
            if details_data.get("result"):
                result = details_data["result"]
                
                # Process photos
                photos = []
                if result.get("photos"):
                    for photo in result["photos"][:5]:
                        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo['photo_reference']}&key={GOOGLE_PLACES_API_KEY}"
                        photos.append(photo_url)
                
                return {
                    "name": result.get("name"),
                    "address": result.get("formatted_address"),
                    "phone": result.get("formatted_phone_number"),
                    "website": result.get("website"),
                    "google_url": result.get("url"),
                    "rating": result.get("rating"),
                    "opening_hours": result.get("opening_hours", {}).get("weekday_text", []),
                    "is_open": result.get("opening_hours", {}).get("open_now"),
                    "reviews": result.get("reviews", [])[:5],
                    "photos": photos
                }
            
            return {"error": "No details found"}
            
    except Exception as e:
        logger.error(f"Google Places API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= ADMIN ENDPOINTS =============

class AdminLoginRequest(BaseModel):
    password: str

@api_router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    """Admin login"""
    if request.password == ADMIN_PASSWORD:
        return {"success": True, "token": ADMIN_PASSWORD}
    raise HTTPException(status_code=401, detail="Invalid password")


@api_router.get("/admin/places")
async def get_admin_places(admin: bool = Depends(verify_admin)):
    """Get all places for admin editing"""
    # Return places from database with any custom edits
    custom_places = await db.places.find({}, {"_id": 0}).to_list(2000)
    custom_dict = {p['original_id']: p for p in custom_places if 'original_id' in p}
    
    # Merge with original data
    result = []
    for place in ATTRACTIONS_DATA:
        if str(place['id']) in custom_dict:
            merged = {**place, **custom_dict[str(place['id'])]}
            result.append(merged)
        else:
            result.append(place)
    
    return result


@api_router.put("/admin/places/{place_id}")
async def update_place(place_id: str, update: PlaceUpdate, admin: bool = Depends(verify_admin)):
    """Update a place (admin only)"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data['original_id'] = place_id
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.places.update_one(
        {"original_id": place_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Place updated successfully"}


@api_router.get("/admin/stats")
async def get_admin_stats(admin: bool = Depends(verify_admin)):
    """Get admin dashboard stats"""
    contact_count = await db.contact_messages.count_documents({})
    feedback_count = await db.feedback.count_documents({})
    trips_count = await db.trips.count_documents({})
    new_feedback = await db.feedback.count_documents({"status": "new"})
    
    return {
        "total_places": len(ATTRACTIONS_DATA),
        "contact_messages": contact_count,
        "feedback_total": feedback_count,
        "feedback_new": new_feedback,
        "trips_created": trips_count
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()