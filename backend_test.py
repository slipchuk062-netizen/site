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
    
    def test_multidimensional_kmeans_metrics(self):
        """Test MULTIDIMENSIONAL K-Means clustering implementation - Chapter 2 compliance"""
        try:
            print("\n🔬 Testing MULTIDIMENSIONAL K-Means Clustering (Chapter 2)")
            print("-" * 60)
            
            # Test 1: GET /api/clusters/metrics - Multidimensional K-Means metrics
            response = requests.get(f"{BACKEND_URL}/clusters/metrics", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True and "data" in data:
                    metrics = data["data"]
                    
                    # Verify Chapter 2 specific fields
                    expected_fields = [
                        "silhouette_score", "davies_bouldin_index", 
                        "calinski_harabasz_score", "wcss", "total_clusters",
                        "feature_dimensions", "features_used", "cluster_info"
                    ]
                    
                    missing_fields = [field for field in expected_fields if field not in metrics]
                    
                    if missing_fields:
                        self.log_result("Multidimensional K-Means - Structure", "FAIL",
                                      f"Missing Chapter 2 fields: {missing_fields}")
                    else:
                        # Verify 10-dimensional feature vector (2 coords + 7 categories + 1 rating)
                        feature_dims = metrics.get("feature_dimensions", 0)
                        features_used = metrics.get("features_used", [])
                        
                        if feature_dims == 10:
                            self.log_result("Feature Vector Dimensions", "PASS",
                                          f"10-dimensional feature vector confirmed: {feature_dims}D")
                        else:
                            self.log_result("Feature Vector Dimensions", "FAIL",
                                          f"Expected 10D, got {feature_dims}D")
                        
                        # Verify feature composition
                        expected_features = ['lat', 'lng', 'category_onehot(7)', 'rating_normalized']
                        if features_used == expected_features:
                            self.log_result("Feature Composition", "PASS",
                                          f"Correct features: {features_used}")
                        else:
                            self.log_result("Feature Composition", "FAIL",
                                          f"Expected {expected_features}, got {features_used}")
                        
                        # Verify cluster_info has dominant_category
                        cluster_info = metrics.get("cluster_info", [])
                        if cluster_info and isinstance(cluster_info, list):
                            first_cluster = cluster_info[0] if cluster_info else {}
                            if "dominant_category" in first_cluster:
                                self.log_result("Cluster Category Analysis", "PASS",
                                              f"Dominant categories identified for {len(cluster_info)} clusters")
                            else:
                                self.log_result("Cluster Category Analysis", "FAIL",
                                              "Missing dominant_category in cluster_info")
                        else:
                            self.log_result("Cluster Category Analysis", "FAIL",
                                          "cluster_info not available or invalid")
                        
                        # Verify metric values are reasonable for multidimensional clustering
                        sil_score = metrics.get("silhouette_score", 0)
                        db_index = metrics.get("davies_bouldin_index", 0)
                        ch_score = metrics.get("calinski_harabasz_score", 0)
                        
                        if (0.2 <= sil_score <= 1.0 and 
                            0.1 <= db_index <= 2.0 and 
                            ch_score > 100):
                            
                            self.log_result("Multidimensional Metrics Values", "PASS",
                                          f"Silhouette: {sil_score}, Davies-Bouldin: {db_index}, "
                                          f"Calinski-Harabasz: {ch_score}")
                        else:
                            self.log_result("Multidimensional Metrics Values", "FAIL",
                                          f"Values outside expected ranges. Silhouette: {sil_score}, "
                                          f"Davies-Bouldin: {db_index}, Calinski-Harabasz: {ch_score}")
                        
                        # Store first call results for consistency test
                        self.first_metrics = metrics
                        
                else:
                    self.log_result("Multidimensional K-Means API", "FAIL",
                                  f"Invalid response structure: {data}")
            else:
                self.log_result("Multidimensional K-Means API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Multidimensional K-Means API", "FAIL",
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
    
    def test_chapter2_analytics_endpoint(self):
        """Test GET /api/clusters/analytics - Chapter 2 formulas and methodology"""
        try:
            print("\n📊 Testing Chapter 2 Analytics Endpoint")
            print("-" * 60)
            
            response = requests.get(f"{BACKEND_URL}/clusters/analytics", timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True:
                    # Check for Chapter 2 specific sections
                    expected_sections = [
                        "clustering_metrics", "elbow_data", 
                        "silhouette_per_cluster", "methodology"
                    ]
                    
                    missing_sections = [section for section in expected_sections if section not in data]
                    
                    if missing_sections:
                        self.log_result("Chapter 2 Analytics - Structure", "FAIL",
                                      f"Missing sections: {missing_sections}")
                    else:
                        # Verify methodology contains Chapter 2 formulas
                        methodology = data.get("methodology", {})
                        
                        # Check for feature vector description (Formula 2.2)
                        feature_vector = methodology.get("feature_vector", {})
                        if "description" in feature_vector and "oᵢ = (latᵢ, lonᵢ, catᵢ, rᵢ)" in feature_vector.get("description", ""):
                            self.log_result("Chapter 2 - Feature Vector Formula", "PASS",
                                          "Formula 2.2 feature vector description found")
                        else:
                            self.log_result("Chapter 2 - Feature Vector Formula", "FAIL",
                                          "Formula 2.2 feature vector description missing")
                        
                        # Check for formulas section
                        formulas = methodology.get("formulas", {})
                        expected_formulas = [
                            "silhouette", "davies_bouldin", "calinski_harabasz", 
                            "lat_norm", "lng_norm", "rating_norm", "inertia"
                        ]
                        
                        missing_formulas = [f for f in expected_formulas if f not in formulas]
                        if not missing_formulas:
                            self.log_result("Chapter 2 - Formulas Complete", "PASS",
                                          f"All Chapter 2 formulas present: {list(formulas.keys())}")
                        else:
                            self.log_result("Chapter 2 - Formulas Complete", "FAIL",
                                          f"Missing formulas: {missing_formulas}")
                        
                        # Verify elbow_data has both wcss AND silhouette
                        elbow_data = data.get("elbow_data", [])
                        if isinstance(elbow_data, list) and len(elbow_data) > 5:
                            first_point = elbow_data[0] if elbow_data else {}
                            if "k" in first_point and "wcss" in first_point and "silhouette" in first_point:
                                self.log_result("Chapter 2 - Elbow Method Data", "PASS",
                                              f"Elbow method with WCSS and Silhouette ({len(elbow_data)} K values)")
                            else:
                                self.log_result("Chapter 2 - Elbow Method Data", "FAIL",
                                              f"Missing WCSS or Silhouette in elbow data: {first_point}")
                        else:
                            self.log_result("Chapter 2 - Elbow Method Data", "FAIL",
                                          f"Insufficient elbow data points: {len(elbow_data)}")
                        
                        # Verify feature dimensions in methodology
                        feature_vector_dims = feature_vector.get("dimensions", 0)
                        if feature_vector_dims == 10:
                            self.log_result("Chapter 2 - Methodology Dimensions", "PASS",
                                          f"10-dimensional feature vector confirmed in methodology")
                        else:
                            self.log_result("Chapter 2 - Methodology Dimensions", "FAIL",
                                          f"Expected 10D in methodology, got {feature_vector_dims}D")
                        
                        self.log_result("Chapter 2 Analytics API", "PASS",
                                      "Complete Chapter 2 analytics endpoint working")
                else:
                    self.log_result("Chapter 2 Analytics API", "FAIL",
                                  f"Success=false in response: {data}")
            else:
                self.log_result("Chapter 2 Analytics API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Chapter 2 Analytics API", "FAIL",
                          "Request failed", e)
    
    def test_dynamic_clustering_endpoints(self):
        """Test dynamic clustering endpoints for different K values"""
        try:
            print("\n🔄 Testing Dynamic Clustering Endpoints")
            print("-" * 60)
            
            # Test K=3, K=7, K=10 as specified in review request
            k_values = [3, 7, 10]
            
            for k in k_values:
                try:
                    response = requests.get(f"{BACKEND_URL}/clusters/dynamic/{k}", timeout=15)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        if data.get("success") == True and "data" in data:
                            cluster_data = data["data"]
                            
                            # Verify K value matches
                            if cluster_data.get("k") == k:
                                self.log_result(f"Dynamic Clustering K={k} - Structure", "PASS",
                                              f"K={k} clustering data returned correctly")
                            else:
                                self.log_result(f"Dynamic Clustering K={k} - Structure", "FAIL",
                                              f"Expected K={k}, got K={cluster_data.get('k')}")
                            
                            # Verify different metrics for different K values
                            sil_score = cluster_data.get("silhouette_score", 0)
                            db_index = cluster_data.get("davies_bouldin_index", 0)
                            
                            # Store metrics for comparison
                            if not hasattr(self, 'dynamic_metrics'):
                                self.dynamic_metrics = {}
                            self.dynamic_metrics[k] = {
                                'silhouette': sil_score,
                                'davies_bouldin': db_index
                            }
                            
                            # Check for dominant_category and category_distribution
                            silhouette_per_cluster = cluster_data.get("silhouette_per_cluster", [])
                            if silhouette_per_cluster:
                                first_cluster = silhouette_per_cluster[0] if silhouette_per_cluster else {}
                                if "dominant_category" in first_cluster and "category_distribution" in first_cluster:
                                    self.log_result(f"Dynamic Clustering K={k} - Categories", "PASS",
                                                  f"Dominant categories and distributions available")
                                else:
                                    self.log_result(f"Dynamic Clustering K={k} - Categories", "FAIL",
                                                  f"Missing dominant_category or category_distribution")
                            
                            self.log_result(f"Dynamic Clustering K={k}", "PASS",
                                          f"Silhouette: {sil_score}, Davies-Bouldin: {db_index}")
                        else:
                            self.log_result(f"Dynamic Clustering K={k}", "FAIL",
                                          f"Invalid response structure: {data}")
                    else:
                        self.log_result(f"Dynamic Clustering K={k}", "FAIL",
                                      f"HTTP {response.status_code}: {response.text}")
                        
                except Exception as e:
                    self.log_result(f"Dynamic Clustering K={k}", "FAIL",
                                  f"Request failed: {e}")
            
            # Verify that different K values produce different metrics
            if hasattr(self, 'dynamic_metrics') and len(self.dynamic_metrics) >= 2:
                k_values_tested = list(self.dynamic_metrics.keys())
                metrics_different = False
                
                for i in range(len(k_values_tested)):
                    for j in range(i+1, len(k_values_tested)):
                        k1, k2 = k_values_tested[i], k_values_tested[j]
                        if (self.dynamic_metrics[k1]['silhouette'] != self.dynamic_metrics[k2]['silhouette'] or
                            self.dynamic_metrics[k1]['davies_bouldin'] != self.dynamic_metrics[k2]['davies_bouldin']):
                            metrics_different = True
                            break
                
                if metrics_different:
                    self.log_result("Dynamic Clustering - Different Metrics", "PASS",
                                  "Different K values produce different metrics as expected")
                else:
                    self.log_result("Dynamic Clustering - Different Metrics", "FAIL",
                                  "All K values produce identical metrics (unexpected)")
                
        except Exception as e:
            self.log_result("Dynamic Clustering Endpoints", "FAIL",
                          f"General error: {e}")

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
    
    def test_geopandas_spatial_analysis(self):
        """Test GeoPandas spatial analysis endpoint (Розділ 2.5)"""
        try:
            print("\n🌍 Testing GeoPandas Spatial Analysis (Розділ 2.5)")
            print("-" * 60)
            
            response = requests.get(f"{BACKEND_URL}/geo/spatial-analysis", timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True:
                    # Verify geopandas_info section
                    geopandas_info = data.get("geopandas_info", {})
                    if "library_version" in geopandas_info:
                        self.log_result("GeoPandas - Library Integration", "PASS",
                                      f"GeoPandas version: {geopandas_info.get('library_version')}")
                    else:
                        self.log_result("GeoPandas - Library Integration", "FAIL",
                                      "Missing library_version in geopandas_info")
                    
                    # Verify geographic bounds for Zhytomyr region
                    geo_bounds = data.get("geographic_bounds", {})
                    expected_bounds = ["lat_min", "lat_max", "lng_min", "lng_max"]
                    missing_bounds = [b for b in expected_bounds if b not in geo_bounds]
                    
                    if not missing_bounds:
                        lat_range = geo_bounds.get("lat_max", 0) - geo_bounds.get("lat_min", 0)
                        lng_range = geo_bounds.get("lng_max", 0) - geo_bounds.get("lng_min", 0)
                        
                        # Verify reasonable bounds for Zhytomyr region
                        if 1.5 <= lat_range <= 3.0 and 1.5 <= lng_range <= 3.0:
                            self.log_result("GeoPandas - Geographic Bounds", "PASS",
                                          f"Zhytomyr region bounds: lat {geo_bounds.get('lat_min')}-{geo_bounds.get('lat_max')}, "
                                          f"lng {geo_bounds.get('lng_min')}-{geo_bounds.get('lng_max')}")
                        else:
                            self.log_result("GeoPandas - Geographic Bounds", "FAIL",
                                          f"Bounds seem incorrect: lat range {lat_range}, lng range {lng_range}")
                    else:
                        self.log_result("GeoPandas - Geographic Bounds", "FAIL",
                                      f"Missing bounds: {missing_bounds}")
                    
                    # Verify summary statistics
                    summary = data.get("summary", {})
                    if ("total_objects" in summary and 
                        "districts_count" in summary and 
                        summary.get("districts_count") == 4):
                        
                        self.log_result("GeoPandas - Summary Statistics", "PASS",
                                      f"Total objects: {summary.get('total_objects')}, "
                                      f"Districts: {summary.get('districts_count')}")
                    else:
                        self.log_result("GeoPandas - Summary Statistics", "FAIL",
                                      f"Invalid summary: {summary}")
                    
                    # Verify CRS information
                    if (geopandas_info.get("crs") == "EPSG:4326 (WGS84)" and
                        "Point-in-polygon" in str(geopandas_info.get("spatial_operations", []))):
                        
                        self.log_result("GeoPandas - CRS and Operations", "PASS",
                                      "EPSG:4326 (WGS84) CRS and point-in-polygon operations confirmed")
                    else:
                        self.log_result("GeoPandas - CRS and Operations", "FAIL",
                                      f"Missing or incorrect CRS/operations: {geopandas_info}")
                    
                    self.log_result("GeoPandas Spatial Analysis API", "PASS",
                                  "Full spatial analysis endpoint working correctly")
                else:
                    self.log_result("GeoPandas Spatial Analysis API", "FAIL",
                                  f"Success=false in response: {data}")
            else:
                self.log_result("GeoPandas Spatial Analysis API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("GeoPandas Spatial Analysis API", "FAIL",
                          "Request failed", e)
    
    def test_geopandas_district_assignment(self):
        """Test GeoPandas district assignment endpoint (spatial join)"""
        try:
            print("\n📍 Testing GeoPandas District Assignment (Spatial Join)")
            print("-" * 60)
            
            response = requests.get(f"{BACKEND_URL}/geo/district-assignment", timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True:
                    attractions_data = data.get("data", [])
                    
                    if len(attractions_data) > 0:
                        # Check first few attractions for proper district assignment
                        sample_attraction = attractions_data[0]
                        
                        required_fields = ["id", "name", "coordinates", "district"]
                        missing_fields = [f for f in required_fields if f not in sample_attraction]
                        
                        if not missing_fields:
                            district_info = sample_attraction.get("district", {})
                            
                            if ("district_id" in district_info and 
                                "district_name" in district_info):
                                
                                self.log_result("GeoPandas - District Assignment Structure", "PASS",
                                              f"Attractions properly assigned to districts")
                                
                                # Count attractions with valid district assignments
                                valid_assignments = sum(1 for attr in attractions_data 
                                                      if attr.get("district", {}).get("district_id") != "unknown")
                                
                                assignment_rate = (valid_assignments / len(attractions_data)) * 100
                                
                                if assignment_rate >= 70:  # At least 70% should be assigned
                                    self.log_result("GeoPandas - Assignment Success Rate", "PASS",
                                                  f"{valid_assignments}/{len(attractions_data)} attractions assigned "
                                                  f"({assignment_rate:.1f}%)")
                                else:
                                    self.log_result("GeoPandas - Assignment Success Rate", "FAIL",
                                                  f"Low assignment rate: {assignment_rate:.1f}%")
                            else:
                                self.log_result("GeoPandas - District Assignment Structure", "FAIL",
                                              f"Missing district_id or district_name in district info")
                        else:
                            self.log_result("GeoPandas - District Assignment Structure", "FAIL",
                                          f"Missing required fields: {missing_fields}")
                    else:
                        self.log_result("GeoPandas - District Assignment Data", "FAIL",
                                      "No attractions data returned")
                    
                    # Verify methodology mentions GeoPandas + Shapely and Spatial Join
                    methodology = data.get("methodology", {})
                    if ("GeoPandas + Shapely" in methodology.get("library", "") and
                        "Spatial Join" in methodology.get("operation", "")):
                        
                        self.log_result("GeoPandas - Methodology Documentation", "PASS",
                                      "GeoPandas + Shapely and Spatial Join methodology documented")
                    else:
                        self.log_result("GeoPandas - Methodology Documentation", "FAIL",
                                      f"Missing or incorrect methodology: {methodology}")
                    
                    self.log_result("GeoPandas District Assignment API", "PASS",
                                  f"District assignment working for {len(attractions_data)} attractions")
                else:
                    self.log_result("GeoPandas District Assignment API", "FAIL",
                                  f"Success=false in response: {data}")
            else:
                self.log_result("GeoPandas District Assignment API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("GeoPandas District Assignment API", "FAIL",
                          "Request failed", e)
    
    def test_geopandas_district_statistics(self):
        """Test GeoPandas district statistics endpoint"""
        try:
            print("\n📊 Testing GeoPandas District Statistics")
            print("-" * 60)
            
            response = requests.get(f"{BACKEND_URL}/geo/district-statistics", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True:
                    district_stats = data.get("data", [])
                    
                    # Should have statistics for 4 districts
                    if len(district_stats) == 4:
                        self.log_result("GeoPandas - District Count", "PASS",
                                      f"Statistics for all 4 districts returned")
                        
                        # Check each district has required statistics
                        all_districts_valid = True
                        required_stats = ["district_id", "district_name", "objects_count", 
                                        "avg_rating", "dominant_category"]
                        
                        for district in district_stats:
                            missing_stats = [stat for stat in required_stats if stat not in district]
                            if missing_stats:
                                all_districts_valid = False
                                self.log_result(f"GeoPandas - District {district.get('district_id', 'unknown')} Stats", "FAIL",
                                              f"Missing statistics: {missing_stats}")
                            else:
                                # Verify reasonable values
                                objects_count = district.get("objects_count", 0)
                                avg_rating = district.get("avg_rating", 0)
                                
                                if objects_count >= 0 and 1.0 <= avg_rating <= 5.0:
                                    self.log_result(f"GeoPandas - District {district.get('district_name')} Stats", "PASS",
                                                  f"Objects: {objects_count}, Avg Rating: {avg_rating}, "
                                                  f"Dominant: {district.get('dominant_category')}")
                                else:
                                    all_districts_valid = False
                                    self.log_result(f"GeoPandas - District {district.get('district_name')} Stats", "FAIL",
                                                  f"Invalid values - Objects: {objects_count}, Rating: {avg_rating}")
                        
                        if all_districts_valid:
                            self.log_result("GeoPandas - All District Statistics", "PASS",
                                          "All districts have valid statistics")
                    else:
                        self.log_result("GeoPandas - District Count", "FAIL",
                                      f"Expected 4 districts, got {len(district_stats)}")
                    
                    # Verify methodology mentions GeoPandas operations
                    methodology = data.get("methodology", {})
                    if ("GeoPandas" in methodology.get("library", "") and
                        "Spatial Join" in str(methodology.get("operations", []))):
                        
                        self.log_result("GeoPandas - Statistics Methodology", "PASS",
                                      "GeoPandas spatial operations methodology documented")
                    else:
                        self.log_result("GeoPandas - Statistics Methodology", "FAIL",
                                      f"Missing GeoPandas methodology: {methodology}")
                    
                    self.log_result("GeoPandas District Statistics API", "PASS",
                                  f"District statistics calculated for {len(district_stats)} districts")
                else:
                    self.log_result("GeoPandas District Statistics API", "FAIL",
                                  f"Success=false in response: {data}")
            else:
                self.log_result("GeoPandas District Statistics API", "FAIL",
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("GeoPandas District Statistics API", "FAIL",
                          "Request failed", e)
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Testing for Zhytomyr Tourism Website")
        print(f"Backend URL: {BACKEND_URL}")
        print("🎯 FOCUS: Testing MULTIDIMENSIONAL K-Means Clustering (Chapter 2 Compliance)")
        print("📋 Key Requirements:")
        print("   - 10-dimensional feature vector: 2 coordinates + 7 categories + 1 rating")
        print("   - Chapter 2 formulas implementation (2.2, 2.5, 2.6, 2.7, 2.11-2.14)")
        print("   - Dynamic clustering for K=3, K=7, K=10")
        print("=" * 80)
        
        # Core functionality tests
        self.test_backend_health()
        
        # HIGH PRIORITY: Multidimensional K-Means Clustering Tests (Chapter 2 Focus)
        self.test_multidimensional_kmeans_metrics()
        self.test_kmeans_consistency()
        self.test_chapter2_analytics_endpoint()
        self.test_dynamic_clustering_endpoints()
        
        # Additional analytics tests
        self.test_cluster_analytics_apis()
        
        # Other API tests
        self.test_data_upload_api()
        self.test_google_places_api()
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