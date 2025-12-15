#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Zhytomyr Tourist Website
Tests all backend endpoints with real data scenarios
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://tourist-map.preview.emergentagent.com/api"
ADMIN_PASSWORD = "zhytomyr2024admin"

class BackendTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_results = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results[test_name] = {"success": success, "details": details}
    
    async def test_health_check(self):
        """Test basic API health"""
        try:
            async with self.session.get(f"{BACKEND_URL}/") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.log_result("API Health Check", True, f"Response: {data}")
                    return True
                else:
                    self.log_result("API Health Check", False, f"Status: {resp.status}")
                    return False
        except Exception as e:
            self.log_result("API Health Check", False, f"Error: {str(e)}")
            return False
    
    async def test_admin_login(self):
        """Test admin login functionality"""
        try:
            login_data = {"password": ADMIN_PASSWORD}
            async with self.session.post(f"{BACKEND_URL}/admin/login", json=login_data) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("success") and data.get("token"):
                        self.admin_token = data["token"]
                        self.log_result("Admin Login", True, f"Token received: {self.admin_token[:10]}...")
                        return True
                    else:
                        self.log_result("Admin Login", False, "No token in response")
                        return False
                else:
                    self.log_result("Admin Login", False, f"Status: {resp.status}")
                    return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Error: {str(e)}")
            return False
    
    async def test_trip_planner_crud(self):
        """Test complete Trip Planner CRUD operations"""
        trip_id = None
        
        # Test CREATE trip
        try:
            trip_data = {
                "name": "Вихідні у Житомирі",
                "description": "Дводенний маршрут по найкращих місцях Житомира",
                "places": [
                    {
                        "place_id": "zhytomyr_museum",
                        "name": "Житомирський обласний краєзнавчий музей",
                        "address": "вул. Київська, 55, Житомир",
                        "coordinates": {"lat": 50.2547, "lng": 28.6587},
                        "category": "historical",
                        "order": 1
                    },
                    {
                        "place_id": "gagarin_park",
                        "name": "Парк ім. Гагаріна",
                        "address": "вул. Гагаріна, Житомир",
                        "coordinates": {"lat": 50.2501, "lng": 28.6701},
                        "category": "parks",
                        "order": 2
                    }
                ]
            }
            
            async with self.session.post(f"{BACKEND_URL}/trips", json=trip_data) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    trip_id = data.get("id")
                    self.log_result("Trip Creation", True, f"Trip ID: {trip_id}")
                else:
                    self.log_result("Trip Creation", False, f"Status: {resp.status}, Response: {await resp.text()}")
                    return False
        except Exception as e:
            self.log_result("Trip Creation", False, f"Error: {str(e)}")
            return False
        
        # Test GET all trips
        try:
            async with self.session.get(f"{BACKEND_URL}/trips") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.log_result("Get All Trips", True, f"Found {len(data)} trips")
                else:
                    self.log_result("Get All Trips", False, f"Status: {resp.status}")
        except Exception as e:
            self.log_result("Get All Trips", False, f"Error: {str(e)}")
        
        # Test GET specific trip
        if trip_id:
            try:
                async with self.session.get(f"{BACKEND_URL}/trips/{trip_id}") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        self.log_result("Get Specific Trip", True, f"Trip name: {data.get('name')}")
                    else:
                        self.log_result("Get Specific Trip", False, f"Status: {resp.status}")
            except Exception as e:
                self.log_result("Get Specific Trip", False, f"Error: {str(e)}")
            
            # Test UPDATE trip
            try:
                update_data = {
                    "name": "Оновлений маршрут по Житомиру",
                    "description": "Розширений маршрут з додатковими місцями",
                    "places": trip_data["places"] + [{
                        "place_id": "korolev_square",
                        "name": "Майдан Корольова",
                        "address": "Майдан Корольова, Житомир",
                        "coordinates": {"lat": 50.2549, "lng": 28.6587},
                        "category": "historical",
                        "order": 3
                    }]
                }
                
                async with self.session.put(f"{BACKEND_URL}/trips/{trip_id}", json=update_data) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        self.log_result("Trip Update", True, f"Updated trip: {data.get('name')}")
                    else:
                        self.log_result("Trip Update", False, f"Status: {resp.status}")
            except Exception as e:
                self.log_result("Trip Update", False, f"Error: {str(e)}")
            
            # Test DELETE trip
            try:
                async with self.session.delete(f"{BACKEND_URL}/trips/{trip_id}") as resp:
                    if resp.status == 200:
                        self.log_result("Trip Deletion", True, "Trip deleted successfully")
                    else:
                        self.log_result("Trip Deletion", False, f"Status: {resp.status}")
            except Exception as e:
                self.log_result("Trip Deletion", False, f"Error: {str(e)}")
        
        return True
    
    async def test_feedback_system(self):
        """Test complete Feedback System"""
        feedback_id = None
        
        # Test feedback submission - all 3 types
        feedback_types = [
            {
                "type": "suggestion",
                "data": {
                    "place_id": "zhytomyr_museum",
                    "place_name": "Житомирський обласний краєзнавчий музей",
                    "feedback_type": "suggestion",
                    "name": "Олена Петренко",
                    "email": "olena.petrenko@example.com",
                    "phone": "+380671234567",
                    "message": "Пропоную додати аудіогід українською мовою для кращого розуміння експозиції."
                }
            },
            {
                "type": "complaint",
                "data": {
                    "place_id": "gagarin_park",
                    "place_name": "Парк ім. Гагаріна",
                    "feedback_type": "complaint",
                    "name": "Андрій Коваленко",
                    "email": "andriy.kovalenko@example.com",
                    "phone": "+380501234567",
                    "message": "Парк потребує кращого освітлення в вечірній час. Деякі доріжки погано освітлені."
                }
            },
            {
                "type": "review",
                "data": {
                    "place_id": "korolev_square",
                    "place_name": "Майдан Корольова",
                    "feedback_type": "review",
                    "name": "Марія Іваненко",
                    "email": "maria.ivanenko@example.com",
                    "phone": "+380931234567",
                    "message": "Чудове місце для прогулянок з родиною. Красива архітектура та затишна атмосфера.",
                    "rating": 5
                }
            }
        ]
        
        for feedback_type in feedback_types:
            try:
                async with self.session.post(f"{BACKEND_URL}/feedback", json=feedback_type["data"]) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if feedback_type["type"] == "review":
                            feedback_id = data.get("id")  # Save for status update test
                        self.log_result(f"Feedback Submission ({feedback_type['type']})", True, f"ID: {data.get('id')}")
                    else:
                        self.log_result(f"Feedback Submission ({feedback_type['type']})", False, f"Status: {resp.status}, Response: {await resp.text()}")
            except Exception as e:
                self.log_result(f"Feedback Submission ({feedback_type['type']})", False, f"Error: {str(e)}")
        
        # Test GET feedback (admin only)
        if self.admin_token:
            try:
                headers = {"Authorization": f"Bearer {self.admin_token}"}
                async with self.session.get(f"{BACKEND_URL}/feedback", headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        self.log_result("Get All Feedback (Admin)", True, f"Found {len(data)} feedback items")
                    else:
                        self.log_result("Get All Feedback (Admin)", False, f"Status: {resp.status}")
            except Exception as e:
                self.log_result("Get All Feedback (Admin)", False, f"Error: {str(e)}")
            
            # Test feedback status update
            if feedback_id:
                try:
                    headers = {"Authorization": f"Bearer {self.admin_token}"}
                    async with self.session.put(f"{BACKEND_URL}/feedback/{feedback_id}/status?status=reviewed", headers=headers) as resp:
                        if resp.status == 200:
                            self.log_result("Update Feedback Status", True, "Status updated to 'reviewed'")
                        else:
                            self.log_result("Update Feedback Status", False, f"Status: {resp.status}")
                except Exception as e:
                    self.log_result("Update Feedback Status", False, f"Error: {str(e)}")
        
        return True
    
    async def test_admin_stats(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            self.log_result("Admin Stats", False, "No admin token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            async with self.session.get(f"{BACKEND_URL}/admin/stats", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    stats = f"Places: {data.get('total_places')}, Messages: {data.get('contact_messages')}, Feedback: {data.get('feedback_total')}, Trips: {data.get('trips_created')}"
                    self.log_result("Admin Stats", True, stats)
                    return True
                else:
                    self.log_result("Admin Stats", False, f"Status: {resp.status}")
                    return False
        except Exception as e:
            self.log_result("Admin Stats", False, f"Error: {str(e)}")
            return False
    
    async def test_google_places_api(self):
        """Test Google Places API integration"""
        try:
            place_name = "Житомирський обласний краєзнавчий музей"
            async with self.session.get(f"{BACKEND_URL}/places/details/{place_name}") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("error"):
                        self.log_result("Google Places API", False, f"API Error: {data['error']}")
                        return False
                    else:
                        details = f"Name: {data.get('name')}, Address: {data.get('address')}, Rating: {data.get('rating')}"
                        self.log_result("Google Places API", True, details)
                        return True
                else:
                    self.log_result("Google Places API", False, f"Status: {resp.status}, Response: {await resp.text()}")
                    return False
        except Exception as e:
            self.log_result("Google Places API", False, f"Error: {str(e)}")
            return False
    
    async def test_ai_assistant(self):
        """Test AI Assistant Chat"""
        try:
            chat_data = {
                "message": "Розкажи мені про найкращі історичні пам'ятки Житомира",
                "session_id": str(uuid.uuid4())
            }
            
            async with self.session.post(f"{BACKEND_URL}/chat", json=chat_data) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    response_preview = data.get("response", "")[:100] + "..." if len(data.get("response", "")) > 100 else data.get("response", "")
                    self.log_result("AI Assistant Chat", True, f"Response: {response_preview}")
                    return True
                else:
                    self.log_result("AI Assistant Chat", False, f"Status: {resp.status}, Response: {await resp.text()}")
                    return False
        except Exception as e:
            self.log_result("AI Assistant Chat", False, f"Error: {str(e)}")
            return False
    
    async def test_contact_form(self):
        """Test existing contact form functionality"""
        try:
            contact_data = {
                "name": "Тестовий Користувач",
                "email": "test.user@example.com",
                "phone": "+380671234567",
                "message": "Тестове повідомлення для перевірки функціональності контактної форми."
            }
            
            async with self.session.post(f"{BACKEND_URL}/contact", json=contact_data) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.log_result("Contact Form", True, f"Message ID: {data.get('id')}")
                    return True
                else:
                    self.log_result("Contact Form", False, f"Status: {resp.status}, Response: {await resp.text()}")
                    return False
        except Exception as e:
            self.log_result("Contact Form", False, f"Error: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not await self.test_health_check():
            print("❌ Backend is not accessible. Stopping tests.")
            return False
        
        # Test admin login (needed for admin endpoints)
        await self.test_admin_login()
        
        # Test all major features
        await self.test_contact_form()
        await self.test_ai_assistant()
        await self.test_trip_planner_crud()
        await self.test_feedback_system()
        await self.test_admin_stats()
        await self.test_google_places_api()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results.values() if result["success"])
        total = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "✅" if result["success"] else "❌"
            print(f"{status} {test_name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed")
            return False

async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"💥 Test runner error: {e}")
        sys.exit(1)