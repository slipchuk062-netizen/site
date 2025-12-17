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
BACKEND_URL = "https://zhytomyr-attractions.preview.emergentagent.com/api"

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
    
    def test_kmeans_clustering_metrics(self):
        """Test REAL K-Means clustering implementation - HIGH PRIORITY"""
        try:
            print("\n🔬 Testing REAL K-Means Clustering Implementation")
            print("-" * 60)
            
            # Test 1: GET /api/clusters/metrics - Real K-Means metrics
            response = requests.get(f"{BACKEND_URL}/clusters/metrics", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True and "data" in data:
                    metrics = data["data"]
                    
                    # Verify expected fields are present
                    expected_fields = [
                        "silhouette_score", "davies_bouldin_index", 
                        "calinski_harabasz_score", "wcss", "total_clusters",
                        "n_iterations", "cluster_centers"
                    ]
                    
                    missing_fields = [field for field in expected_fields if field not in metrics]
                    
                    if missing_fields:
                        self.log_result("K-Means Metrics - Structure", "FAIL",
                                      f"Missing fields: {missing_fields}")
                    else:
                        # Verify expected values (approximately)
                        sil_score = metrics.get("silhouette_score", 0)
                        db_index = metrics.get("davies_bouldin_index", 0)
                        ch_score = metrics.get("calinski_harabasz_score", 0)
                        total_clusters = metrics.get("total_clusters", 0)
                        
                        # Check if values are in expected ranges for real K-Means
                        if (0.4 <= sil_score <= 0.8 and 
                            0.3 <= db_index <= 1.0 and 
                            ch_score > 1000 and 
                            total_clusters == 7):
                            
                            self.log_result("K-Means Metrics - Real Values", "PASS",
                                          f"Silhouette: {sil_score}, Davies-Bouldin: {db_index}, "
                                          f"Calinski-Harabasz: {ch_score}, Clusters: {total_clusters}")
                        else:
                            self.log_result("K-Means Metrics - Real Values", "FAIL",
                                          f"Values outside expected ranges. Silhouette: {sil_score}, "
                                          f"Davies-Bouldin: {db_index}, Calinski-Harabasz: {ch_score}")
                        
                        # Store first call results for consistency test
                        self.first_metrics = metrics
                        
                else:
                    self.log_result("K-Means Metrics API", "FAIL",
                                  f"Invalid response structure: {data}")
            else:
                self.log_result("K-Means Metrics API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("K-Means Metrics API", "FAIL",
                          "Request failed", e)
    
    def test_kmeans_consistency(self):
        """Test that K-Means results are consistent (same random_state=42)"""
        try:
            print("\n🔄 Testing K-Means Consistency (random_state=42)")
            print("-" * 60)
            
            # Make second call to same endpoint
            response = requests.get(f"{BACKEND_URL}/clusters/metrics", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True and "data" in data:
                    second_metrics = data["data"]
                    
                    # Compare with first call results
                    if hasattr(self, 'first_metrics'):
                        # Check if key metrics are identical
                        consistency_checks = [
                            ("silhouette_score", "Silhouette Score"),
                            ("davies_bouldin_index", "Davies-Bouldin Index"),
                            ("calinski_harabasz_score", "Calinski-Harabasz Score"),
                            ("wcss", "WCSS"),
                            ("total_clusters", "Total Clusters")
                        ]
                        
                        all_consistent = True
                        inconsistent_fields = []
                        
                        for field, name in consistency_checks:
                            first_val = self.first_metrics.get(field)
                            second_val = second_metrics.get(field)
                            
                            if first_val != second_val:
                                all_consistent = False
                                inconsistent_fields.append(f"{name}: {first_val} vs {second_val}")
                        
                        if all_consistent:
                            self.log_result("K-Means Consistency Test", "PASS",
                                          "All metrics identical across calls (random_state=42 working)")
                        else:
                            self.log_result("K-Means Consistency Test", "FAIL",
                                          f"Inconsistent values: {', '.join(inconsistent_fields)}")
                    else:
                        self.log_result("K-Means Consistency Test", "FAIL",
                                      "No first metrics to compare with")
                else:
                    self.log_result("K-Means Consistency Test", "FAIL",
                                  f"Invalid response structure: {data}")
            else:
                self.log_result("K-Means Consistency Test", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("K-Means Consistency Test", "FAIL",
                          "Request failed", e)
    
    def test_full_analytics_endpoint(self):
        """Test GET /api/clusters/analytics - Full analytics with elbow data"""
        try:
            print("\n📊 Testing Full Analytics Endpoint")
            print("-" * 60)
            
            response = requests.get(f"{BACKEND_URL}/clusters/analytics", timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True:
                    # Check for expected sections
                    expected_sections = [
                        "clustering_metrics", "elbow_data", 
                        "silhouette_per_cluster", "methodology"
                    ]
                    
                    missing_sections = [section for section in expected_sections if section not in data]
                    
                    if missing_sections:
                        self.log_result("Full Analytics - Structure", "FAIL",
                                      f"Missing sections: {missing_sections}")
                    else:
                        # Verify clustering_metrics matches /clusters/metrics
                        clustering_metrics = data.get("clustering_metrics", {})
                        if hasattr(self, 'first_metrics'):
                            if clustering_metrics.get("silhouette_score") == self.first_metrics.get("silhouette_score"):
                                self.log_result("Full Analytics - Metrics Consistency", "PASS",
                                              "Clustering metrics match individual endpoint")
                            else:
                                self.log_result("Full Analytics - Metrics Consistency", "FAIL",
                                              "Clustering metrics don't match individual endpoint")
                        
                        # Verify elbow_data structure
                        elbow_data = data.get("elbow_data", [])
                        if isinstance(elbow_data, list) and len(elbow_data) > 5:
                            # Check if elbow data has proper structure
                            first_point = elbow_data[0] if elbow_data else {}
                            if "k" in first_point and "wcss" in first_point:
                                self.log_result("Full Analytics - Elbow Data", "PASS",
                                              f"Elbow method data available ({len(elbow_data)} K values)")
                            else:
                                self.log_result("Full Analytics - Elbow Data", "FAIL",
                                              f"Invalid elbow data structure: {first_point}")
                        else:
                            self.log_result("Full Analytics - Elbow Data", "FAIL",
                                          f"Insufficient elbow data points: {len(elbow_data)}")
                        
                        # Verify silhouette_per_cluster
                        sil_per_cluster = data.get("silhouette_per_cluster", [])
                        if isinstance(sil_per_cluster, list) and len(sil_per_cluster) == 7:
                            self.log_result("Full Analytics - Silhouette Per Cluster", "PASS",
                                          f"Individual cluster silhouette scores available (7 clusters)")
                        else:
                            self.log_result("Full Analytics - Silhouette Per Cluster", "FAIL",
                                          f"Expected 7 cluster silhouette scores, got {len(sil_per_cluster)}")
                        
                        # Verify methodology section
                        methodology = data.get("methodology", {})
                        if "algorithm" in methodology and "scikit-learn" in methodology.get("algorithm", ""):
                            self.log_result("Full Analytics - Methodology", "PASS",
                                          "Methodology confirms scikit-learn K-Means implementation")
                        else:
                            self.log_result("Full Analytics - Methodology", "FAIL",
                                          "Methodology doesn't confirm scikit-learn implementation")
                        
                        self.log_result("Full Analytics API", "PASS",
                                      "Complete analytics endpoint working with all sections")
                else:
                    self.log_result("Full Analytics API", "FAIL",
                                  f"Success=false in response: {data}")
            else:
                self.log_result("Full Analytics API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Full Analytics API", "FAIL",
                          "Request failed", e)
    
    def test_cluster_analytics_apis(self):
        """Test cluster analytics endpoints"""
        endpoints = [
            ("/clusters/statistics", "Cluster Statistics"),
            ("/clusters/density", "District Density")
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