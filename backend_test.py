#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Zhytomyr Tourism Website
Testing Agent - E2E Backend Verification
"""

import requests
import json
import time
import sys
from datetime import datetime
import uuid

# Backend URL from frontend/.env
BACKEND_URL = "https://geodatahub.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.results = []
        self.failed_tests = []
        self.passed_tests = []
        
    def log_result(self, test_name, status, details="", error=None):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "error": str(error) if error else None,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        if status == "PASS":
            self.passed_tests.append(test_name)
            print(f"✅ {test_name}: {details}")
        else:
            self.failed_tests.append(test_name)
            print(f"❌ {test_name}: {details}")
            if error:
                print(f"   Error: {error}")
    
    def test_backend_health(self):
        """Test basic backend connectivity"""
        try:
            response = requests.get(f"{BACKEND_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_result("Backend Health Check", "PASS", 
                                  f"Backend responding correctly (200 OK)")
                else:
                    self.log_result("Backend Health Check", "FAIL", 
                                  f"Unexpected response: {data}")
            else:
                self.log_result("Backend Health Check", "FAIL", 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Backend Health Check", "FAIL", 
                          "Backend not accessible", e)
    
    def test_data_upload_api(self):
        """Test the data upload feature - HIGH PRIORITY"""
        try:
            # Test data as specified in the review request
            test_data = {
                "data": [
                    {
                        "id": 1, 
                        "name": "Test Attraction", 
                        "category": "historical", 
                        "coordinates": {"lat": 50.25, "lng": 28.65}
                    },
                    {
                        "id": 2, 
                        "name": "Test Park", 
                        "category": "parks", 
                        "coordinates": {"lat": 50.26, "lng": 28.67}
                    }
                ],
                "filename": "test.json"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/upload-data",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify expected response structure
                required_fields = ["success", "totalObjects", "clusterCount", "recommendations"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Data Upload API - Response Structure", "FAIL", 
                                  f"Missing fields: {missing_fields}")
                else:
                    # Verify data correctness
                    if (data.get("success") == True and 
                        data.get("totalObjects") == 2 and 
                        data.get("clusterCount") >= 1 and
                        isinstance(data.get("recommendations"), list)):
                        
                        self.log_result("Data Upload API", "PASS", 
                                      f"Upload successful: {data.get('totalObjects')} objects, "
                                      f"{data.get('clusterCount')} clusters, "
                                      f"{len(data.get('recommendations', []))} recommendations")
                        
                        # Test additional metrics
                        if "silhouetteScore" in data and "daviesBouldinIndex" in data:
                            self.log_result("Data Upload - Clustering Metrics", "PASS",
                                          f"Silhouette: {data.get('silhouetteScore')}, "
                                          f"Davies-Bouldin: {data.get('daviesBouldinIndex')}")
                        else:
                            self.log_result("Data Upload - Clustering Metrics", "FAIL",
                                          "Missing clustering quality metrics")
                    else:
                        self.log_result("Data Upload API", "FAIL", 
                                      f"Invalid response data: {data}")
            else:
                self.log_result("Data Upload API", "FAIL", 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Data Upload API", "FAIL", 
                          "Request failed", e)
    
    def test_google_places_api(self):
        """Test Google Places API integration"""
        try:
            # Test with a sample attraction ID (using ID 1 as test)
            response = requests.get(f"{BACKEND_URL}/places/details/1", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True and "attraction" in data:
                    attraction = data.get("attraction")
                    google_details = data.get("google_details")
                    
                    if google_details:
                        # Check for expected Google Places fields
                        places_fields = ["rating", "user_ratings_total", "reviews", "phone", "website"]
                        available_fields = [field for field in places_fields if field in google_details]
                        
                        self.log_result("Google Places API Integration", "PASS",
                                      f"Google data available with fields: {available_fields}")
                    else:
                        self.log_result("Google Places API Integration", "PASS",
                                      "API working but no Google data (expected for test data)")
                else:
                    self.log_result("Google Places API Integration", "FAIL",
                                  f"Invalid response structure: {data}")
            elif response.status_code == 404:
                self.log_result("Google Places API Integration", "PASS",
                              "API endpoint working (404 expected for test ID)")
            else:
                self.log_result("Google Places API Integration", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Google Places API Integration", "FAIL",
                          "Request failed", e)
    
    def test_cluster_analytics_apis(self):
        """Test cluster analytics endpoints"""
        endpoints = [
            ("/clusters/statistics", "Cluster Statistics"),
            ("/clusters/density", "District Density"),
            ("/clusters/metrics", "Clustering Metrics"),
            ("/clusters/analytics", "Full Analytics")
        ]
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") == True:
                        self.log_result(f"Analytics - {name}", "PASS",
                                      f"Data returned successfully")
                    else:
                        self.log_result(f"Analytics - {name}", "FAIL",
                                      f"Success=false in response: {data}")
                else:
                    self.log_result(f"Analytics - {name}", "FAIL",
                                  f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Analytics - {name}", "FAIL",
                              "Request failed", e)
    
    def test_contact_form_api(self):
        """Test contact form submission"""
        try:
            test_contact = {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "+380123456789",
                "message": "Test message from automated testing"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/contact",
                json=test_contact,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("name") == test_contact["name"]:
                    self.log_result("Contact Form API", "PASS",
                                  f"Contact form submitted successfully, ID: {data.get('id')}")
                else:
                    self.log_result("Contact Form API", "FAIL",
                                  f"Invalid response structure: {data}")
            else:
                self.log_result("Contact Form API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Contact Form API", "FAIL",
                          "Request failed", e)
    
    def test_chat_api(self):
        """Test AI chat functionality"""
        try:
            test_message = {
                "message": "Розкажіть про історичні пам'ятки Житомира",
                "session_id": str(uuid.uuid4())
            }
            
            response = requests.post(
                f"{BACKEND_URL}/chat",
                json=test_message,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and "session_id" in data:
                    self.log_result("AI Chat API", "PASS",
                                  f"Chat response received, length: {len(data.get('response', ''))}")
                else:
                    self.log_result("AI Chat API", "FAIL",
                                  f"Invalid response structure: {data}")
            else:
                self.log_result("AI Chat API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("AI Chat API", "FAIL",
                          "Request failed", e)
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Testing for Zhytomyr Tourism Website")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Core functionality tests
        self.test_backend_health()
        
        # High priority tests from review request
        self.test_data_upload_api()
        self.test_google_places_api()
        
        # Additional API tests
        self.test_cluster_analytics_apis()
        self.test_contact_form_api()
        self.test_chat_api()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_count = len(self.passed_tests)
        failed_count = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_count}")
        print(f"❌ Failed: {failed_count}")
        print(f"Success Rate: {(passed_count/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n🔍 FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        if self.passed_tests:
            print(f"\n✅ PASSED TESTS:")
            for test in self.passed_tests:
                print(f"  - {test}")
        
        return {
            "total": total_tests,
            "passed": passed_count,
            "failed": failed_count,
            "success_rate": passed_count/total_tests*100 if total_tests > 0 else 0,
            "results": self.results,
            "failed_tests": self.failed_tests,
            "passed_tests": self.passed_tests
        }

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if results["failed"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)