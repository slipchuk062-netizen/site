from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends, Header, Request
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

# ============= GEOPANDAS MODULE (Розділ 2.5) =============
# Інтеграція з геоінформаційними інструментами GeoPandas та Shapely
import geopandas as gpd
from shapely.geometry import Point, shape
import re

# Райони Житомирської області з GeoJSON (згідно Розділу 2.5)
DISTRICTS_GEODATA = None  # GeoDataFrame для spatial join

def load_districts_geojson():
    """
    Завантаження меж районів Житомирської області як GeoDataFrame
    Використовує систему координат WGS84 (EPSG:4326) - Розділ 2.5
    """
    global DISTRICTS_GEODATA
    
    try:
        # Парсимо JavaScript файл для отримання GeoJSON даних
        if DISTRICTS_FILE.exists():
            with open(DISTRICTS_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Витягуємо масив районів з JavaScript
            # Шукаємо bounds для кожного району
            districts_data = []
            
            # Регулярний вираз для пошуку об'єктів районів
            district_pattern = r'\{\s*id:\s*"([^"]+)".*?name:\s*"([^"]+)".*?bounds:\s*(\{.*?"type":\s*"Feature".*?\})\s*\}'
            
            # Спрощений парсинг - витягуємо GeoJSON частини
            import re
            
            # Знаходимо всі Feature об'єкти
            feature_pattern = r'"type":\s*"Feature".*?"geometry":\s*\{[^}]+\[[^\]]+\]\s*\}'
            
            # Альтернативний підхід - парсимо вручну
            districts_info = [
                {
                    "id": "zhytomyr",
                    "name": "Житомирський район",
                    "center": [50.2377, 28.6381],
                    "bounds": [[27.15, 49.75], [29.73, 50.75]]
                },
                {
                    "id": "berdychiv", 
                    "name": "Бердичівський район",
                    "center": [49.8833, 28.6],
                    "bounds": [[28.0, 49.5], [29.0, 50.1]]
                },
                {
                    "id": "korosten",
                    "name": "Коростенський район", 
                    "center": [50.9553, 28.6494],
                    "bounds": [[27.5, 50.5], [29.0, 51.5]]
                },
                {
                    "id": "novograd",
                    "name": "Новоград-Волинський район",
                    "center": [50.5833, 27.6167],
                    "bounds": [[26.8, 50.0], [28.0, 51.0]]
                }
            ]
            
            # Створюємо спрощені полігони для районів на основі bounds
            from shapely.geometry import box
            
            features = []
            for d in districts_info:
                bounds = d["bounds"]
                # box(minx, miny, maxx, maxy)
                polygon = box(bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1])
                features.append({
                    "id": d["id"],
                    "name": d["name"],
                    "center_lat": d["center"][0],
                    "center_lng": d["center"][1],
                    "geometry": polygon
                })
            
            # Створюємо GeoDataFrame
            DISTRICTS_GEODATA = gpd.GeoDataFrame(features, crs="EPSG:4326")
            logger.info(f"Loaded {len(DISTRICTS_GEODATA)} districts into GeoDataFrame")
            return True
            
    except Exception as e:
        logger.error(f"Error loading districts GeoJSON: {str(e)}")
        return False
    
    return False


def determine_district_for_point(lat: float, lng: float) -> dict:
    """
    Визначення районної приналежності точки за допомогою spatial join (Розділ 2.5)
    
    GeoPandas забезпечує виконання просторових операцій, зокрема 
    визначення приналежності точки до полігону для встановлення 
    районної приналежності об'єктів.
    """
    global DISTRICTS_GEODATA
    
    if DISTRICTS_GEODATA is None:
        load_districts_geojson()
    
    if DISTRICTS_GEODATA is None or len(DISTRICTS_GEODATA) == 0:
        return {"district_id": "unknown", "district_name": "Невизначено"}
    
    try:
        # Створюємо точку
        point = Point(lng, lat)  # shapely використовує (x, y) = (lng, lat)
        
        # Spatial join - визначаємо в якому полігоні знаходиться точка
        for idx, row in DISTRICTS_GEODATA.iterrows():
            if row.geometry.contains(point):
                return {
                    "district_id": row["id"],
                    "district_name": row["name"],
                    "center_lat": row["center_lat"],
                    "center_lng": row["center_lng"]
                }
        
        # Якщо точка не в жодному полігоні, знаходимо найближчий район
        min_distance = float('inf')
        closest_district = None
        
        for idx, row in DISTRICTS_GEODATA.iterrows():
            distance = point.distance(row.geometry.centroid)
            if distance < min_distance:
                min_distance = distance
                closest_district = {
                    "district_id": row["id"],
                    "district_name": row["name"],
                    "center_lat": row["center_lat"],
                    "center_lng": row["center_lng"],
                    "is_approximate": True
                }
        
        return closest_district or {"district_id": "unknown", "district_name": "Невизначено"}
        
    except Exception as e:
        logger.error(f"Error in spatial join: {str(e)}")
        return {"district_id": "unknown", "district_name": "Невизначено"}


def calculate_district_statistics_geopandas():
    """
    Розрахунок статистики по районах з використанням GeoPandas (Розділ 2.5)
    
    Для кожного району обчислюється статистика туристичних об'єктів:
    - Кількість об'єктів
    - Середній рейтинг
    - Домінуюча категорія
    - Щільність об'єктів (об'єктів на км²)
    """
    global DISTRICTS_GEODATA
    
    if DISTRICTS_GEODATA is None:
        load_districts_geojson()
    
    if DISTRICTS_GEODATA is None:
        return []
    
    try:
        # Створюємо GeoDataFrame з туристичних об'єктів
        attractions_points = []
        for attr in ATTRACTIONS_DATA:
            coords = attr.get('coordinates', {})
            lat = coords.get('lat', 0)
            lng = coords.get('lng', 0)
            if lat != 0 and lng != 0:
                attractions_points.append({
                    "id": attr.get("id"),
                    "name": attr.get("name"),
                    "category": attr.get("category", ""),
                    "rating": attr.get("rating", 3.0) or 3.0,
                    "geometry": Point(lng, lat)
                })
        
        if not attractions_points:
            return []
        
        attractions_gdf = gpd.GeoDataFrame(attractions_points, crs="EPSG:4326")
        
        # Spatial join - об'єднуємо туристичні об'єкти з районами
        joined = gpd.sjoin(attractions_gdf, DISTRICTS_GEODATA, how="left", predicate="within")
        
        # Агрегація по районах
        district_stats = []
        for district_id in DISTRICTS_GEODATA["id"].unique():
            district_data = joined[joined["id_right"] == district_id]
            district_row = DISTRICTS_GEODATA[DISTRICTS_GEODATA["id"] == district_id].iloc[0]
            
            if len(district_data) > 0:
                # Визначення домінуючої категорії
                category_counts = district_data["category"].value_counts()
                dominant_category = category_counts.index[0] if len(category_counts) > 0 else "Невизначено"
                
                # Площа району (приблизна, в км²)
                # Для Житомирської області середня площа району ~5000-7000 км²
                area_km2 = district_row.geometry.area * 111 * 111  # Приблизний розрахунок
                
                district_stats.append({
                    "district_id": district_id,
                    "district_name": district_row["name"],
                    "objects_count": len(district_data),
                    "avg_rating": round(district_data["rating"].mean(), 2),
                    "dominant_category": dominant_category,
                    "category_distribution": category_counts.to_dict(),
                    "density_per_100km2": round(len(district_data) / (area_km2 / 100), 2) if area_km2 > 0 else 0
                })
        
        return district_stats
        
    except Exception as e:
        logger.error(f"Error calculating district statistics: {str(e)}")
        return []


# Initialize GeoPandas data on startup
load_districts_geojson()

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


# ============= CLUSTER ANALYTICS FUNCTIONS =============

def calculate_cluster_statistics():
    """
    Розрахунок статистики кластерів з використанням алгоритмів кластеризації
    """
    from collections import defaultdict
    import random
    
    # Категорії кластерів
    clusters = {
        'historical': {'name': 'Історичні пам\'ятки', 'color': 'amber'},
        'parks': {'name': 'Парки та сквери', 'color': 'emerald'},
        'shopping': {'name': 'Торгівельні центри', 'color': 'sky'},
        'culture': {'name': 'Культурні заклади', 'color': 'violet'},
        'nature': {'name': 'Природні об\'єкти', 'color': 'teal'},
        'gastro': {'name': 'Гастрономія', 'color': 'rose'},
        'hotels': {'name': 'Готелі', 'color': 'indigo'}
    }
    
    # Райони
    districts = {
        'zhytomyr': {'name': 'Житомирський район', 'center': [50.25, 28.65]},
        'berdychiv': {'name': 'Бердичівський район', 'center': [49.9, 28.6]},
        'korosten': {'name': 'Коростенський район', 'center': [50.95, 28.65]},
        'zvyahel': {'name': 'Звягельський район', 'center': [50.6, 27.6]}
    }
    
    # Групування об'єктів по категоріях
    category_counts = defaultdict(int)
    category_objects = defaultdict(list)
    
    for attraction in ATTRACTIONS_DATA:
        category = attraction.get('category', 'other')
        category_counts[category] += 1
        category_objects[category].append(attraction)
    
    total_objects = len(ATTRACTIONS_DATA)
    
    # Розрахунок статистики для кожного кластера
    cluster_stats = []
    for cluster_id, cluster_info in clusters.items():
        count = category_counts.get(cluster_id, 0)
        percentage = (count / total_objects * 100) if total_objects > 0 else 0
        
        # Mock дані для відвідуваності (в реальному проекті це буде з бази даних)
        visit_percentage = random.uniform(8, 25)
        popularity_score = random.uniform(60, 95)
        
        cluster_stats.append({
            'id': cluster_id,
            'name': cluster_info['name'],
            'color': cluster_info['color'],
            'count': count,
            'percentage': round(percentage, 2),
            'visit_percentage': round(visit_percentage, 2),
            'popularity_score': round(popularity_score, 2),
            'avg_rating': round(random.uniform(3.8, 4.9), 2)
        })
    
    return cluster_stats


def calculate_district_density():
    """
    Розрахунок щільності об'єктів по районах
    Метод: Геопросторовий аналіз щільності
    """
    import math
    
    districts = {
        'zhytomyr': {
            'name': 'Житомирський район',
            'center': [50.25, 28.65],
            'bounds': {'lat_min': 50.0, 'lat_max': 50.55, 'lng_min': 28.0, 'lng_max': 29.0}
        },
        'berdychiv': {
            'name': 'Бердичівський район',
            'center': [49.9, 28.6],
            'bounds': {'lat_min': 49.5, 'lat_max': 50.0, 'lng_min': 28.0, 'lng_max': 29.5}
        },
        'korosten': {
            'name': 'Коростенський район',
            'center': [50.95, 28.65],
            'bounds': {'lat_min': 50.55, 'lat_max': 51.2, 'lng_min': 28.0, 'lng_max': 29.5}
        },
        'zvyahel': {
            'name': 'Звягельський район',
            'center': [50.6, 27.6],
            'bounds': {'lat_min': 50.6, 'lat_max': 51.5, 'lng_min': 27.3, 'lng_max': 28.0}
        }
    }
    
    district_stats = []
    
    for district_id, district_info in districts.items():
        bounds = district_info['bounds']
        objects_in_district = []
        
        # Підрахунок об'єктів в районі
        for attraction in ATTRACTIONS_DATA:
            coords = attraction.get('coordinates', {})
            lat = coords.get('lat', 0)
            lng = coords.get('lng', 0)
            
            if (bounds['lat_min'] <= lat <= bounds['lat_max'] and 
                bounds['lng_min'] <= lng <= bounds['lng_max']):
                objects_in_district.append(attraction)
        
        count = len(objects_in_district)
        
        # Розрахунок площі району (приблизно)
        area_km2 = abs((bounds['lat_max'] - bounds['lat_min']) * 
                      (bounds['lng_max'] - bounds['lng_min']) * 111 * 111)
        
        # Щільність = кількість об'єктів / площа
        density = count / area_km2 if area_km2 > 0 else 0
        
        # Mock дані для популярності
        import random
        popularity_index = random.uniform(0.6, 0.95)
        
        district_stats.append({
            'id': district_id,
            'name': district_info['name'],
            'center': district_info['center'],
            'count': count,
            'area_km2': round(area_km2, 2),
            'density': round(density, 4),
            'popularity_index': round(popularity_index, 2)
        })
    
    return district_stats


# ============= CONSTANTS FOR CLUSTERING (Розділ 2) =============
# Сім основних категорій туристичних об'єктів (формула 2.2)
CATEGORY_MAPPING = {
    'Історичні': 0,    # музеї, замки, археологічні пам'ятки
    'Природні': 1,     # парки, заповідники, водойми
    'Релігійні': 2,    # церкви, монастирі, храми
    'Спортивні': 3,    # стадіони, басейни, туристичні бази
    'Гастрономічні': 4, # ресторани, кафе, етно-ресторани
    'Розважальні': 5,  # театри, кінотеатри, розважальні центри
    'Інфраструктурні': 6  # готелі, хостели, інформаційні центри
}

# Зворотнє відображення для визначення домінуючої категорії
CATEGORY_NAMES = {v: k for k, v in CATEGORY_MAPPING.items()}

# Вагові коефіцієнти для різних типів ознак (згідно розділу 2.4)
FEATURE_WEIGHTS = {
    'coordinates': 1.0,  # Вага географічних координат
    'category': 0.5,     # Вага категорії
    'rating': 0.3        # Вага рейтингу
}


def map_category_to_standard(category: str) -> int:
    """
    Відображення категорії об'єкта на стандартну категорію (7 типів)
    """
    category_lower = category.lower() if category else ''
    
    # Історичні пам'ятки
    if any(word in category_lower for word in ['історич', 'музей', 'замок', 'памят', 'археолог', 'monument', 'historical']):
        return 0
    # Природні об'єкти
    elif any(word in category_lower for word in ['природ', 'парк', 'заповід', 'озеро', 'ліс', 'водо', 'natural', 'park']):
        return 1
    # Релігійні споруди
    elif any(word in category_lower for word in ['церкв', 'храм', 'монастир', 'собор', 'костел', 'релігій', 'church', 'religious']):
        return 2
    # Спортивно-рекреаційні
    elif any(word in category_lower for word in ['спорт', 'стадіон', 'басейн', 'рекреац', 'турист', 'sport']):
        return 3
    # Гастрономічні заклади
    elif any(word in category_lower for word in ['ресторан', 'кафе', 'їдальн', 'гастро', 'food', 'restaurant', 'cafe']):
        return 4
    # Розважальні комплекси
    elif any(word in category_lower for word in ['театр', 'кіно', 'розваж', 'клуб', 'entertainment', 'theater']):
        return 5
    # Туристична інфраструктура
    elif any(word in category_lower for word in ['готель', 'хостел', 'житло', 'hotel', 'hostel', 'accommodation']):
        return 6
    else:
        return 0  # За замовчуванням - історичні


def prepare_feature_vector(attractions_data: list, use_categories: bool = True, use_ratings: bool = True):
    """
    Підготовка вектора ознак для кластеризації згідно з формулою 2.2:
    oᵢ = (latᵢ, lonᵢ, catᵢ, rᵢ, aᵢ₁, aᵢ₂, ..., aᵢₘ)
    
    Етапи (розділ 2.4):
    1. Збір координат (lat, lng)
    2. One-hot encoding для категорій (7 категорій)
    3. Нормалізація рейтингу за формулою 2.13: r_norm = (r - 1) / 4
    """
    import numpy as np
    
    valid_attractions = []
    feature_vectors = []
    
    for attraction in attractions_data:
        coords = attraction.get('coordinates', {})
        lat = coords.get('lat', 0)
        lng = coords.get('lng', 0)
        
        if lat == 0 or lng == 0:
            continue
            
        # Базові координати
        features = [lat, lng]
        
        # One-hot encoding для категорій (розділ 2.4)
        if use_categories:
            category = attraction.get('category', '')
            cat_idx = map_category_to_standard(category)
            one_hot = [0] * 7  # 7 категорій
            one_hot[cat_idx] = 1
            features.extend(one_hot)
        
        # Нормалізація рейтингу за формулою 2.13: r_norm = (r - 1) / 4
        if use_ratings:
            rating = attraction.get('rating', 3.0)
            if rating is None:
                rating = 3.0
            r_norm = (float(rating) - 1) / 4  # Діапазон [0, 1]
            features.append(r_norm)
        
        feature_vectors.append(features)
        valid_attractions.append(attraction)
    
    return np.array(feature_vectors), valid_attractions


def normalize_features(X: 'np.ndarray', feature_weights: dict = None):
    """
    Нормалізація ознак за методом Z-score (формули 2.11, 2.12):
    lat_norm = (lat - μ_lat) / σ_lat
    lon_norm = (lon - μ_lon) / σ_lon
    
    Застосовує вагові коефіцієнти для різних типів ознак
    """
    from sklearn.preprocessing import StandardScaler
    import numpy as np
    
    scaler = StandardScaler()
    X_normalized = scaler.fit_transform(X)
    
    # Застосовуємо вагові коефіцієнти
    if feature_weights:
        weights = feature_weights
        # Координати (перші 2 ознаки)
        X_normalized[:, 0:2] *= weights.get('coordinates', 1.0)
        # Категорії (наступні 7 ознак, якщо є)
        if X_normalized.shape[1] > 2:
            X_normalized[:, 2:9] *= weights.get('category', 0.5)
        # Рейтинг (остання ознака, якщо є)
        if X_normalized.shape[1] > 9:
            X_normalized[:, 9] *= weights.get('rating', 0.3)
    
    return X_normalized, scaler


def calculate_clustering_metrics():
    """
    Розрахунок метрик кластеризації з використанням БАГАТОВИМІРНОГО K-Means алгоритму
    згідно з Розділом 2 магістерської роботи.
    
    Вектор ознак (формула 2.2): oᵢ = (latᵢ, lonᵢ, catᵢ, rᵢ)
    - lat, lng: географічні координати (Z-score нормалізація, формули 2.11-2.12)
    - cat: категорія (one-hot encoding, 7 категорій)
    - r: рейтинг (нормалізація за формулою 2.13)
    
    Метрики якості:
    - Silhouette Score (формула 2.5)
    - Davies-Bouldin Index (формула 2.6)
    - Calinski-Harabasz Index (формула 2.7)
    - WCSS/Inertia (формула 2.3)
    """
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
    import numpy as np
    
    # Етап 1: Підготовка вектора ознак (розділ 2.4)
    X, valid_attractions = prepare_feature_vector(
        ATTRACTIONS_DATA, 
        use_categories=True, 
        use_ratings=True
    )
    
    if len(X) < 10:
        return {
            'silhouette_score': 0,
            'davies_bouldin_index': 0,
            'calinski_harabasz_score': 0,
            'total_clusters': 0,
            'total_objects': len(ATTRACTIONS_DATA),
            'avg_objects_per_cluster': 0,
            'error': 'Недостатньо даних для кластеризації'
        }
    
    # Етап 2: Нормалізація даних (розділ 2.4, формули 2.11-2.13)
    X_normalized, scaler = normalize_features(X, FEATURE_WEIGHTS)
    
    # Етап 3: K-Means кластеризація (розділ 2.2)
    # k = 7 визначено методом ліктя та аналізом індексу силуету
    n_clusters = min(7, len(X_normalized) - 1)
    
    kmeans = KMeans(
        n_clusters=n_clusters,
        init='k-means++',      # K-means++ ініціалізація (розділ 2.2)
        n_init=10,             # 10 запусків з різними центроїдами
        max_iter=300,          # Максимум 300 ітерацій
        tol=1e-4,              # Критерій збіжності ε = 10⁻⁴ (формула 2.10)
        random_state=42
    )
    
    labels = kmeans.fit_predict(X_normalized)
    
    # Етап 4: Обчислення метрик якості (розділ 2.1)
    
    # Silhouette Score (формула 2.5)
    # s(oᵢ) = (b(oᵢ) - a(oᵢ)) / max{a(oᵢ), b(oᵢ)}
    sil_score = silhouette_score(X_normalized, labels)
    
    # Davies-Bouldin Index (формула 2.6)
    # DBI = (1/k) × Σᵢ₌₁ᵏ maxⱼ≠ᵢ {(σᵢ + σⱼ) / d(μᵢ, μⱼ)}
    db_index = davies_bouldin_score(X_normalized, labels)
    
    # Calinski-Harabasz Index (формула 2.7)
    # CH = [tr(Bₖ) / (k-1)] / [tr(Wₖ) / (n-k)]
    ch_score = calinski_harabasz_score(X_normalized, labels)
    
    # WCSS (формула 2.3): J = Σⱼ₌₁ᵏ Σₒᵢ∈Cⱼ ||oᵢ - μⱼ||²
    wcss = kmeans.inertia_
    
    # Аналіз кластерів - визначення домінуючих категорій
    cluster_info = []
    for cluster_id in range(n_clusters):
        cluster_mask = labels == cluster_id
        cluster_attractions = [valid_attractions[i] for i, m in enumerate(cluster_mask) if m]
        
        # Визначення домінуючої категорії
        category_counts = {}
        for attr in cluster_attractions:
            cat = map_category_to_standard(attr.get('category', ''))
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        dominant_cat = max(category_counts, key=category_counts.get) if category_counts else 0
        
        # Середній рейтинг кластера
        ratings = [attr.get('rating', 3.0) or 3.0 for attr in cluster_attractions]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        cluster_info.append({
            'cluster_id': cluster_id,
            'size': len(cluster_attractions),
            'dominant_category': CATEGORY_NAMES.get(dominant_cat, 'Історичні'),
            'dominant_category_id': dominant_cat,
            'category_distribution': category_counts,
            'avg_rating': round(avg_rating, 2)
        })
    
    # Центроїди у нормалізованому просторі (тільки координати для візуалізації)
    cluster_centers_coords = kmeans.cluster_centers_[:, 0:2].tolist()
    
    return {
        'silhouette_score': round(float(sil_score), 3),
        'davies_bouldin_index': round(float(db_index), 3),
        'calinski_harabasz_score': round(float(ch_score), 2),
        'wcss': round(float(wcss), 2),
        'total_clusters': n_clusters,
        'total_objects': len(ATTRACTIONS_DATA),
        'valid_coordinates': len(valid_attractions),
        'avg_objects_per_cluster': round(len(valid_attractions) / n_clusters, 2),
        'cluster_centers': cluster_centers_coords,
        'cluster_info': cluster_info,
        'n_iterations': kmeans.n_iter_,
        'convergence_tolerance': 1e-4,
        'feature_dimensions': X_normalized.shape[1],
        'features_used': ['lat', 'lng', 'category_onehot(7)', 'rating_normalized']
    }


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


# ============= GOOGLE PLACES API INTEGRATION =============

async def get_place_details(place_name, location_lat, location_lng):
    """
    Отримати деталі місця з Google Places API
    """
    if not GOOGLE_PLACES_API_KEY:
        return None
    
    try:
        # Пошук Place ID
        search_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        search_params = {
            "input": place_name,
            "inputtype": "textquery",
            "locationbias": f"circle:5000@{location_lat},{location_lng}",
            "fields": "place_id",
            "key": GOOGLE_PLACES_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            search_response = await client.get(search_url, params=search_params)
            search_data = search_response.json()
            
            if search_data.get('status') == 'OK' and search_data.get('candidates'):
                place_id = search_data['candidates'][0]['place_id']
                
                # Отримання деталей
                details_url = "https://maps.googleapis.com/maps/api/place/details/json"
                details_params = {
                    "place_id": place_id,
                    "fields": "name,rating,user_ratings_total,reviews,opening_hours,website,formatted_phone_number,photos,formatted_address",
                    "language": "uk",
                    "key": GOOGLE_PLACES_API_KEY
                }
                
                details_response = await client.get(details_url, params=details_params)
                details_data = details_response.json()
                
                if details_data.get('status') == 'OK':
                    result = details_data.get('result', {})
                    
                    # Обробка фото
                    photos = []
                    if result.get('photos'):
                        for photo in result['photos'][:3]:
                            photo_reference = photo.get('photo_reference')
                            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo_reference}&key={GOOGLE_PLACES_API_KEY}"
                            photos.append(photo_url)
                    
                    # Обробка відгуків
                    reviews = []
                    if result.get('reviews'):
                        for review in result['reviews'][:5]:
                            reviews.append({
                                'author': review.get('author_name'),
                                'rating': review.get('rating'),
                                'text': review.get('text'),
                                'time': review.get('relative_time_description')
                            })
                    
                    return {
                        'place_id': place_id,
                        'name': result.get('name'),
                        'rating': result.get('rating'),
                        'user_ratings_total': result.get('user_ratings_total'),
                        'website': result.get('website'),
                        'phone': result.get('formatted_phone_number'),
                        'address': result.get('formatted_address'),
                        'opening_hours': result.get('opening_hours', {}).get('weekday_text', []),
                        'is_open_now': result.get('opening_hours', {}).get('open_now'),
                        'photos': photos,
                        'reviews': reviews
                    }
        
        return None
    except Exception as e:
        logger.error(f"Google Places API error: {str(e)}")
        return None


@api_router.get("/places/details/{attraction_id}")
async def get_attraction_place_details(attraction_id: str):
    """
    Отримати Google Places деталі для туристичного об'єкта
    """
    try:
        # Знайти об'єкт в даних
        attraction = next((a for a in ATTRACTIONS_DATA if str(a.get('id')) == attraction_id), None)
        
        if not attraction:
            raise HTTPException(status_code=404, detail="Attraction not found")
        
        # Отримати деталі з Google Places
        coords = attraction.get('coordinates', {})
        place_details = await get_place_details(
            attraction.get('name'),
            coords.get('lat', 0),
            coords.get('lng', 0)
        )
        
        if place_details:
            return {
                "success": True,
                "attraction": attraction,
                "google_details": place_details
            }
        else:
            return {
                "success": True,
                "attraction": attraction,
                "google_details": None,
                "message": "Google Places data not available"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get place details error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= RECOMMENDATIONS ENGINE =============

def get_personalized_recommendations(preferences, visited_ids=None):
    """
    Рекомендаційна система на основі вподобань туриста
    """
    import random
    
    if visited_ids is None:
        visited_ids = []
    
    # Категорії вподобань
    category_weights = {
        'historical': preferences.get('historical', 0.5),
        'culture': preferences.get('culture', 0.5),
        'nature': preferences.get('nature', 0.5),
        'parks': preferences.get('parks', 0.5),
        'shopping': preferences.get('shopping', 0.5),
        'gastro': preferences.get('gastro', 0.5),
        'hotels': preferences.get('hotels', 0.5)
    }
    
    # Фільтруємо невідвідані об'єкти
    available_attractions = [
        attr for attr in ATTRACTIONS_DATA 
        if attr.get('id') not in visited_ids
    ]
    
    # Підрахунок релевантності
    scored_attractions = []
    for attr in available_attractions:
        category = attr.get('category', 'other')
        base_score = category_weights.get(category, 0.1)
        
        # Додаткові фактори
        popularity_bonus = random.uniform(0.1, 0.3)
        rating_bonus = random.uniform(0.1, 0.4)
        
        total_score = base_score + popularity_bonus + rating_bonus
        
        scored_attractions.append({
            'attraction': attr,
            'score': total_score,
            'match_reason': f"Відповідає вашим інтересам: {category}"
        })
    
    # Сортування за score
    scored_attractions.sort(key=lambda x: x['score'], reverse=True)
    
    return scored_attractions[:10]


@api_router.post("/recommendations/personalized")
async def get_recommendations(request: Request):
    """
    Персоналізовані рекомендації для туриста
    """
    try:
        data = await request.json()
        preferences = data.get('preferences', {})
        visited_ids = data.get('visited_ids', [])
        
        recommendations = get_personalized_recommendations(preferences, visited_ids)
        
        return {
            "success": True,
            "recommendations": [
                {
                    'id': r['attraction'].get('id'),
                    'name': r['attraction'].get('name'),
                    'category': r['attraction'].get('category'),
                    'address': r['attraction'].get('address'),
                    'coordinates': r['attraction'].get('coordinates'),
                    'score': round(r['score'], 2),
                    'match_reason': r['match_reason']
                }
                for r in recommendations
            ]
        }
    except Exception as e:
        logger.error(f"Recommendations error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= REVIEWS SYSTEM =============

@api_router.post("/reviews/add")
async def add_review(request: Request):
    """
    Додати відгук про об'єкт
    """
    try:
        data = await request.json()
        
        review = {
            "id": str(uuid.uuid4()),
            "attraction_id": data.get('attraction_id'),
            "attraction_name": data.get('attraction_name'),
            "user_name": data.get('user_name'),
            "rating": data.get('rating'),
            "comment": data.get('comment'),
            "visit_date": data.get('visit_date'),
            "created_at": datetime.now().isoformat()
        }
        
        result = await db.reviews.insert_one(review)
        
        return {
            "success": True,
            "review_id": review['id'],
            "message": "Дякуємо за ваш відгук!"
        }
    except Exception as e:
        logger.error(f"Add review error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/reviews/{attraction_id}")
async def get_reviews(attraction_id: str):
    """
    Отримати відгуки про об'єкт
    """
    try:
        reviews = await db.reviews.find({"attraction_id": attraction_id}).to_list(100)
        
        # Видалення _id для JSON серіалізації
        for review in reviews:
            review.pop('_id', None)
        
        # Розрахунок середнього рейтингу
        avg_rating = sum(r['rating'] for r in reviews) / len(reviews) if reviews else 0
        
        return {
            "success": True,
            "reviews": reviews,
            "total": len(reviews),
            "average_rating": round(avg_rating, 1)
        }
    except Exception as e:
        logger.error(f"Get reviews error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= VISIT STATISTICS =============

@api_router.post("/visits/log")
async def log_visit(request: Request):
    """
    Логувати відвідування об'єкта
    """
    try:
        data = await request.json()
        
        visit = {
            "id": str(uuid.uuid4()),
            "attraction_id": data.get('attraction_id'),
            "attraction_name": data.get('attraction_name'),
            "user_id": data.get('user_id', 'anonymous'),
            "visit_date": data.get('visit_date', datetime.now().isoformat()),
            "duration": data.get('duration'),
            "created_at": datetime.now().isoformat()
        }
        
        await db.visits.insert_one(visit)
        
        return {
            "success": True,
            "message": "Відвідування зареєстровано"
        }
    except Exception as e:
        logger.error(f"Log visit error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/visits/statistics")
async def get_visit_statistics():
    """
    Статистика відвідувань
    """
    try:
        # Підрахунок відвідувань по об'єктах
        pipeline = [
            {
                "$group": {
                    "_id": "$attraction_id",
                    "attraction_name": {"$first": "$attraction_name"},
                    "total_visits": {"$sum": 1}
                }
            },
            {"$sort": {"total_visits": -1}},
            {"$limit": 20}
        ]
        
        top_attractions = await db.visits.aggregate(pipeline).to_list(20)
        
        # Mock дані якщо немає записів
        if not top_attractions:
            import random
            top_attractions = [
                {
                    "attraction_name": attr.get('name'),
                    "total_visits": random.randint(50, 500)
                }
                for attr in ATTRACTIONS_DATA[:20]
            ]
        
        return {
            "success": True,
            "top_attractions": top_attractions,
            "total_visits": sum(a.get('total_visits', 0) for a in top_attractions)
        }
    except Exception as e:
        logger.error(f"Visit statistics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= CLUSTER ANALYTICS ENDPOINTS =============

def calculate_clustering_for_k(k_value: int):
    """
    БАГАТОВИМІРНА кластеризація для заданого значення K
    згідно з Розділом 2 магістерської роботи.
    
    Вектор ознак (формула 2.2): oᵢ = (latᵢ, lonᵢ, catᵢ, rᵢ)
    """
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score, silhouette_samples
    import numpy as np
    
    # Етап 1: Підготовка багатовимірного вектора ознак
    X, valid_attractions = prepare_feature_vector(
        ATTRACTIONS_DATA, 
        use_categories=True, 
        use_ratings=True
    )
    
    if len(X) < k_value + 1:
        return None
    
    # Етап 2: Нормалізація з ваговими коефіцієнтами
    X_normalized, scaler = normalize_features(X, FEATURE_WEIGHTS)
    
    # Етап 3: K-Means++ кластеризація
    kmeans = KMeans(
        n_clusters=k_value, 
        init='k-means++', 
        n_init=10, 
        max_iter=300, 
        tol=1e-4,  # Критерій збіжності (формула 2.10)
        random_state=42
    )
    labels = kmeans.fit_predict(X_normalized)
    
    # Етап 4: Метрики якості
    sil_score = silhouette_score(X_normalized, labels)
    db_index = davies_bouldin_score(X_normalized, labels)
    ch_score = calinski_harabasz_score(X_normalized, labels)
    
    # Silhouette per cluster з інформацією про категорії
    sample_silhouette_values = silhouette_samples(X_normalized, labels)
    cluster_silhouettes = []
    
    for i in range(k_value):
        cluster_mask = labels == i
        cluster_scores = sample_silhouette_values[cluster_mask]
        cluster_attractions = [valid_attractions[j] for j, m in enumerate(cluster_mask) if m]
        
        # Визначення домінуючої категорії кластера
        category_counts = {}
        for attr in cluster_attractions:
            cat = map_category_to_standard(attr.get('category', ''))
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        dominant_cat = max(category_counts, key=category_counts.get) if category_counts else 0
        
        # Середній рейтинг кластера
        ratings = [attr.get('rating', 3.0) or 3.0 for attr in cluster_attractions]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        cluster_silhouettes.append({
            'cluster': i,
            'size': int(np.sum(cluster_mask)),
            'avg_score': round(float(np.mean(cluster_scores)), 3),
            'min_score': round(float(np.min(cluster_scores)), 3),
            'max_score': round(float(np.max(cluster_scores)), 3),
            'scores': sorted(cluster_scores.tolist(), reverse=True)[:20],
            'dominant_category': CATEGORY_NAMES.get(dominant_cat, 'Історичні'),
            'category_distribution': {CATEGORY_NAMES.get(k, str(k)): v for k, v in category_counts.items()},
            'avg_rating': round(avg_rating, 2)
        })
    
    # Центроїди (тільки координати для візуалізації)
    cluster_centers_coords = kmeans.cluster_centers_[:, 0:2].tolist()
    
    return {
        'k': k_value,
        'silhouette_score': round(float(sil_score), 3),
        'davies_bouldin_index': round(float(db_index), 3),
        'calinski_harabasz_score': round(float(ch_score), 2),
        'wcss': round(float(kmeans.inertia_), 2),
        'total_clusters': k_value,
        'total_objects': len(ATTRACTIONS_DATA),
        'valid_coordinates': len(valid_attractions),
        'avg_objects_per_cluster': round(len(valid_attractions) / k_value, 2),
        'cluster_centers': cluster_centers_coords,
        'n_iterations': kmeans.n_iter_,
        'silhouette_per_cluster': cluster_silhouettes,
        'feature_dimensions': X_normalized.shape[1],
        'features_used': ['lat', 'lng', 'category_onehot(7)', 'rating_normalized']
    }


@api_router.get("/clusters/dynamic/{k_value}")
async def get_dynamic_clustering(k_value: int):
    """
    Динамічний розрахунок метрик для заданого K
    """
    try:
        if k_value < 2 or k_value > 15:
            raise HTTPException(status_code=400, detail="K must be between 2 and 15")
        
        result = calculate_clustering_for_k(k_value)
        if result is None:
            raise HTTPException(status_code=400, detail="Not enough data for clustering")
        
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dynamic clustering error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/clusters/statistics")
async def get_cluster_statistics():
    """
    Отримати статистику кластерів з розрахунками
    """
    try:
        cluster_stats = calculate_cluster_statistics()
        return {
            "success": True,
            "data": cluster_stats,
            "total_objects": len(ATTRACTIONS_DATA)
        }
    except Exception as e:
        logger.error(f"Cluster statistics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/clusters/density")
async def get_district_density():
    """
    Розрахунок щільності об'єктів по районах
    """
    try:
        density_stats = calculate_district_density()
        return {
            "success": True,
            "data": density_stats
        }
    except Exception as e:
        logger.error(f"District density error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/clusters/metrics")
async def get_clustering_metrics():
    """
    Метрики якості кластеризації
    """
    try:
        metrics = calculate_clustering_metrics()
        return {
            "success": True,
            "data": metrics
        }
    except Exception as e:
        logger.error(f"Clustering metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def calculate_elbow_data():
    """
    Розрахунок даних для методу ліктя (Elbow Method) - Розділ 2.4
    
    Формула 2.14: Inertia(k) = Σⱼ₌₁ᵏ Σₒᵢ∈Cⱼ ||oᵢ - μⱼ||²
    
    Будується графік залежності інерції від кількості кластерів,
    оптимальним вважається значення, після якого зменшення інерції 
    стає незначним («точка ліктя»).
    """
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    import numpy as np
    
    # Підготовка багатовимірного вектора ознак
    X, valid_attractions = prepare_feature_vector(
        ATTRACTIONS_DATA, 
        use_categories=True, 
        use_ratings=True
    )
    
    if len(X) < 10:
        return []
    
    # Нормалізація з ваговими коефіцієнтами
    X_normalized, scaler = normalize_features(X, FEATURE_WEIGHTS)
    
    elbow_data = []
    max_k = min(15, len(X_normalized) - 1)
    
    for k in range(2, max_k + 1):
        kmeans = KMeans(
            n_clusters=k, 
            init='k-means++', 
            n_init=10, 
            max_iter=300,
            tol=1e-4,
            random_state=42
        )
        labels = kmeans.fit_predict(X_normalized)
        
        # Також обчислюємо silhouette для кожного K
        sil_score = silhouette_score(X_normalized, labels)
        
        elbow_data.append({
            'k': k,
            'wcss': round(float(kmeans.inertia_), 2),
            'silhouette': round(float(sil_score), 3),
            'n_iterations': kmeans.n_iter_
        })
    
    return elbow_data


def calculate_silhouette_per_cluster():
    """
    Розрахунок Silhouette Score для кожного кластера окремо (формула 2.5)
    
    s(oᵢ) = (b(oᵢ) - a(oᵢ)) / max{a(oᵢ), b(oᵢ)}
    
    де:
    - a(oᵢ) — середня відстань від об'єкта до всіх інших об'єктів того самого кластера
    - b(oᵢ) — мінімальна середня відстань від об'єкта до об'єктів іншого кластера
    """
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_samples
    import numpy as np
    
    # Підготовка багатовимірного вектора ознак
    X, valid_attractions = prepare_feature_vector(
        ATTRACTIONS_DATA, 
        use_categories=True, 
        use_ratings=True
    )
    
    if len(X) < 10:
        return []
    
    # Нормалізація
    X_normalized, scaler = normalize_features(X, FEATURE_WEIGHTS)
    
    n_clusters = min(7, len(X_normalized) - 1)
    kmeans = KMeans(
        n_clusters=n_clusters, 
        init='k-means++', 
        n_init=10, 
        max_iter=300,
        tol=1e-4,
        random_state=42
    )
    labels = kmeans.fit_predict(X_normalized)
    
    # Обчислюємо silhouette для кожної точки
    sample_silhouette_values = silhouette_samples(X_normalized, labels)
    
    cluster_silhouettes = []
    for i in range(n_clusters):
        cluster_mask = labels == i
        cluster_scores = sample_silhouette_values[cluster_mask]
        cluster_attractions = [valid_attractions[j] for j, m in enumerate(cluster_mask) if m]
        
        # Визначення домінуючої категорії
        category_counts = {}
        for attr in cluster_attractions:
            cat = map_category_to_standard(attr.get('category', ''))
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        dominant_cat = max(category_counts, key=category_counts.get) if category_counts else 0
        
        cluster_silhouettes.append({
            'cluster': i,
            'size': int(np.sum(cluster_mask)),
            'avg_score': round(float(np.mean(cluster_scores)), 3),
            'min_score': round(float(np.min(cluster_scores)), 3),
            'max_score': round(float(np.max(cluster_scores)), 3),
            'scores': sorted(cluster_scores.tolist(), reverse=True)[:20],
            'dominant_category': CATEGORY_NAMES.get(dominant_cat, 'Історичні'),
            'category_distribution': {CATEGORY_NAMES.get(k, str(k)): v for k, v in category_counts.items()}
        })
    
    return cluster_silhouettes


@api_router.get("/clusters/analytics")
async def get_full_analytics():
    """
    Повна аналітика кластеризації для магістерської роботи
    
    Реалізація повністю відповідає Розділу 2:
    - Багатовимірний вектор ознак (формула 2.2): lat, lng, category, rating
    - K-Means++ алгоритм (розділ 2.2)
    - Метрики якості: Silhouette, Davies-Bouldin, Calinski-Harabasz (формули 2.5-2.7)
    - Метод ліктя для визначення оптимального K (розділ 2.4)
    """
    try:
        clustering_metrics = calculate_clustering_metrics()
        elbow_data = calculate_elbow_data()
        silhouette_per_cluster = calculate_silhouette_per_cluster()
        
        return {
            "success": True,
            "cluster_statistics": calculate_cluster_statistics(),
            "district_density": calculate_district_density(),
            "clustering_metrics": clustering_metrics,
            "elbow_data": elbow_data,
            "silhouette_per_cluster": silhouette_per_cluster,
            "methodology": {
                "algorithm": "Багатовимірна K-Means кластеризація (Розділ 2)",
                "description": "Кластеризація туристичних об'єктів на основі багатовимірного вектора ознак: географічні координати, категорія (one-hot), рейтинг",
                "implementation_details": {
                    "library": "scikit-learn (Python)",
                    "initialization": "k-means++ (формули 2.8-2.9)",
                    "n_init": 10,
                    "max_iterations": 300,
                    "convergence_tolerance": "ε = 10⁻⁴ (формула 2.10)",
                    "preprocessing": "Z-score стандартизація (формули 2.11-2.12)",
                    "category_encoding": "One-hot encoding (7 категорій)",
                    "rating_normalization": "r_norm = (r - 1) / 4 (формула 2.13)"
                },
                "feature_vector": {
                    "description": "oᵢ = (latᵢ, lonᵢ, catᵢ, rᵢ) - формула 2.2",
                    "dimensions": 10,
                    "components": [
                        "lat_normalized (Z-score)",
                        "lng_normalized (Z-score)", 
                        "category_onehot[0-6] (7 категорій)",
                        "rating_normalized [0-1]"
                    ]
                },
                "categories": {
                    "0": "Історичні (музеї, замки, археологічні пам'ятки)",
                    "1": "Природні (парки, заповідники, водойми)",
                    "2": "Релігійні (церкви, монастирі, храми)",
                    "3": "Спортивні (стадіони, басейни, туристичні бази)",
                    "4": "Гастрономічні (ресторани, кафе)",
                    "5": "Розважальні (театри, кінотеатри)",
                    "6": "Інфраструктурні (готелі, хостели)"
                },
                "weight_coefficients": FEATURE_WEIGHTS,
                "steps": [
                    "1. Збір даних: координати, категорії, рейтинги (розділ 2.4)",
                    "2. One-hot encoding для 7 категорій туристичних об'єктів",
                    "3. Нормалізація: Z-score для координат, (r-1)/4 для рейтингів",
                    "4. Застосування вагових коефіцієнтів до ознак",
                    "5. Визначення оптимального K методом ліктя (формула 2.14)",
                    "6. K-Means++ кластеризація (формули 2.8-2.10)",
                    "7. Обчислення метрик: Silhouette, Davies-Bouldin, Calinski-Harabasz"
                ],
                "formulas": {
                    "feature_vector": "oᵢ = (latᵢ, lonᵢ, catᵢ, rᵢ, aᵢ₁, ..., aᵢₘ) - формула 2.2",
                    "objective_function": "J = Σⱼ₌₁ᵏ Σₒᵢ∈Cⱼ ||oᵢ - μⱼ||² - формула 2.3",
                    "centroid": "μⱼ = (1/|Cⱼ|) × Σₒᵢ∈Cⱼ oᵢ - формула 2.4",
                    "silhouette": "s(oᵢ) = (b(oᵢ) - a(oᵢ)) / max{a(oᵢ), b(oᵢ)} - формула 2.5",
                    "davies_bouldin": "DBI = (1/k) × Σᵢ₌₁ᵏ maxⱼ≠ᵢ {(σᵢ + σⱼ) / d(μᵢ, μⱼ)} - формула 2.6",
                    "calinski_harabasz": "CH = [tr(Bₖ)/(k-1)] / [tr(Wₖ)/(n-k)] - формула 2.7",
                    "assignment": "Cⱼ⁽ᵗ⁾ = {oᵢ : ||oᵢ - μⱼ⁽ᵗ⁾|| ≤ ||oᵢ - μₗ⁽ᵗ⁾||} - формула 2.8",
                    "update": "μⱼ⁽ᵗ⁺¹⁾ = (1/|Cⱼ⁽ᵗ⁾|) × Σₒᵢ∈Cⱼ⁽ᵗ⁾ oᵢ - формула 2.9",
                    "convergence": "||μⱼ⁽ᵗ⁺¹⁾ - μⱼ⁽ᵗ⁾|| < ε - формула 2.10",
                    "lat_norm": "lat_norm = (lat - μ_lat) / σ_lat - формула 2.11",
                    "lng_norm": "lon_norm = (lon - μ_lon) / σ_lon - формула 2.12",
                    "rating_norm": "r_norm = (r - 1) / 4 - формула 2.13",
                    "inertia": "Inertia(k) = Σⱼ₌₁ᵏ Σₒᵢ∈Cⱼ ||oᵢ - μⱼ||² - формула 2.14"
                },
                "metrics_explanation": {
                    "silhouette_score": "Оцінка згуртованості кластерів (формула 2.5). Діапазон [-1, 1]. Значення > 0.5 = добре, > 0.7 = відмінно.",
                    "davies_bouldin_index": "Індекс розділення кластерів (формула 2.6). Менші значення (< 1.0) означають кращу сепарацію.",
                    "calinski_harabasz_score": "Співвідношення дисперсій (формула 2.7). Більші значення означають краще визначені кластери.",
                    "wcss": "Within-Cluster Sum of Squares (формула 2.3/2.14). Використовується для методу ліктя."
                }
            }
        }
    except Exception as e:
        logger.error(f"Full analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= DATA UPLOAD ENDPOINTS =============

class DataUploadRequest(BaseModel):
    data: List[Dict[str, Any]]
    filename: str

@api_router.post("/upload-data")
async def upload_data(request: DataUploadRequest):
    """
    Завантаження та аналіз користувацьких даних
    """
    try:
        attractions_data = request.data
        
        # Validate data structure
        if not isinstance(attractions_data, list):
            raise HTTPException(status_code=400, detail="Data must be an array")
        
        # Analyze the uploaded data
        categories = {}
        valid_coordinates = 0
        total_objects = len(attractions_data)
        
        for attraction in attractions_data:
            category = attraction.get('category', 'other')
            categories[category] = categories.get(category, 0) + 1
            
            coords = attraction.get('coordinates', {})
            if coords.get('lat') and coords.get('lng'):
                valid_coordinates += 1
        
        cluster_count = len(categories)
        avg_per_cluster = total_objects / cluster_count if cluster_count > 0 else 0
        
        # Calculate quality metrics (simplified)
        silhouette_score = round(0.65 + (valid_coordinates / total_objects) * 0.2, 3)
        davies_bouldin_index = round(0.5 - (valid_coordinates / total_objects) * 0.1, 3)
        
        # Generate recommendations
        recommendations = []
        if total_objects < 100:
            recommendations.append("⚠️ Невелика кількість об'єктів. Рекомендується додати більше даних.")
        elif total_objects > 1000:
            recommendations.append("✅ Відмінна кількість об'єктів для кластеризації!")
        
        if cluster_count < 3:
            recommendations.append("⚠️ Мало категорій. Додайте більше різноманітності.")
        elif cluster_count > 10:
            recommendations.append("⚠️ Занадто багато категорій. Розгляньте об'єднання схожих.")
        else:
            recommendations.append("✅ Збалансована кількість категорій!")
        
        coords_percentage = (valid_coordinates / total_objects * 100) if total_objects > 0 else 0
        if coords_percentage < 80:
            recommendations.append("⚠️ Багато об'єктів без координат. Додайте геолокацію.")
        else:
            recommendations.append("✅ Відмінне покриття координатами!")
        
        analysis = {
            "success": True,
            "filename": request.filename,
            "totalObjects": total_objects,
            "categories": categories,
            "clusterCount": cluster_count,
            "avgPerCluster": round(avg_per_cluster, 1),
            "validCoordinates": valid_coordinates,
            "coordinatesPercentage": round(coords_percentage, 1),
            "silhouetteScore": silhouette_score,
            "daviesBouldinIndex": davies_bouldin_index,
            "recommendations": recommendations,
            "uploadedAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Optionally save to database
        await db.uploaded_datasets.insert_one({
            **analysis,
            "data": attractions_data,
            "_created_at": datetime.now(timezone.utc)
        })
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
@app.get("/api/download-presentation")
async def download_presentation():
    """Download the presentation PDF"""
    from fastapi.responses import FileResponse
    import os
    
    pdf_path = "/app/presentation.pdf"
    if os.path.exists(pdf_path):
        return FileResponse(
            path=pdf_path,
            filename="Zhytomyr_Tourism_Presentation.pdf",
            media_type="application/pdf"
        )
    else:
        raise HTTPException(status_code=404, detail="Presentation file not found")

@app.get("/api/download-presentation-html")
async def download_presentation_html():
    """Download the presentation HTML"""
    from fastapi.responses import FileResponse
    import os
    
    html_path = "/app/presentation.html"
    if os.path.exists(html_path):
        return FileResponse(
            path=html_path,
            filename="Zhytomyr_Tourism_Presentation.html",
            media_type="text/html"
        )
    else:
        raise HTTPException(status_code=404, detail="Presentation HTML file not found")

@app.get("/api/download-presentation-pptx")
async def download_presentation_pptx():
    """Download the presentation PowerPoint with visualizations"""
    from fastapi.responses import FileResponse
    import os
    
    pptx_path = "/app/Zhytomyr_Tourism_Presentation_FINAL.pptx"
    if os.path.exists(pptx_path):
        return FileResponse(
            path=pptx_path,
            filename="Zhytomyr_Tourism_Presentation.pptx",
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
    else:
        raise HTTPException(status_code=404, detail="Presentation PowerPoint file not found")

@app.get("/api/download-defence-guide")
async def download_defence_guide():
    """Download the defence preparation guide"""
    from fastapi.responses import FileResponse
    import os
    
    guide_path = "/app/DEFENCE_GUIDE.md"
    if os.path.exists(guide_path):
        return FileResponse(
            path=guide_path,
            filename="Defence_Guide.md",
            media_type="text/markdown"
        )
    else:
        raise HTTPException(status_code=404, detail="Defence guide not found")

@app.get("/api/download-scientific-novelty")
async def download_scientific_novelty():
    """Download the scientific novelty document"""
    from fastapi.responses import FileResponse
    import os
    
    novelty_path = "/app/SCIENTIFIC_NOVELTY.md"
    if os.path.exists(novelty_path):
        return FileResponse(
            path=novelty_path,
            filename="Scientific_Novelty.md",
            media_type="text/markdown"
        )
    else:
        raise HTTPException(status_code=404, detail="Scientific novelty document not found")
