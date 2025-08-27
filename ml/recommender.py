import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
import joblib
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime
import time

app = Flask(__name__)
CORS(app)

# Model paths
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
TFIDF_MODEL_PATH = os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl')
PROBLEMS_PATH = os.path.join(MODEL_DIR, 'problems_data.json')
USER_VECTORS_PATH = os.path.join(MODEL_DIR, 'user_vectors.json')

# Cache time (in seconds)
CACHE_TIME = 3600  # 1 hour

class CodeforcesRecommender:
    def __init__(self):
        self.problems_df = None
        self.tfidf_vectorizer = None
        self.problem_vectors = None
        self.user_vectors = {}
        self.last_update = 0
        self.initialize()
    
    def initialize(self):
        """Initialize the recommender system."""
        # Check if we have saved problems data and it's recent
        if os.path.exists(PROBLEMS_PATH) and time.time() - os.path.getmtime(PROBLEMS_PATH) < CACHE_TIME:
            with open(PROBLEMS_PATH, 'r') as f:
                problems_data = json.load(f)
            self.problems_df = pd.DataFrame(problems_data)
        else:
            # Fetch problems from Codeforces API
            self.fetch_problems()
        
        # Load user vectors if available
        if os.path.exists(USER_VECTORS_PATH):
            with open(USER_VECTORS_PATH, 'r') as f:
                self.user_vectors = json.load(f)
        
        # Create or load the TF-IDF vectorizer
        if os.path.exists(TFIDF_MODEL_PATH):
            self.tfidf_vectorizer = joblib.load(TFIDF_MODEL_PATH)
            self.process_problem_features()
        else:
            self.create_tfidf_vectorizer()
    
    def fetch_problems(self):
        """Fetch problems from Codeforces API."""
        try:
            response = requests.get('https://codeforces.com/api/problemset.problems')
            data = response.json()
            
            if data['status'] == 'OK':
                problems = data['result']['problems']
                problem_statistics = data['result'].get('problemStatistics', [])
                
                # Create a dictionary of problem statistics
                stats_dict = {}
                for stat in problem_statistics:
                    key = f"{stat['contestId']}_{stat['index']}"
                    stats_dict[key] = stat.get('solvedCount', 0)
                
                # Add solved count to problems
                for problem in problems:
                    key = f"{problem['contestId']}_{problem['index']}"
                    problem['solvedCount'] = stats_dict.get(key, 0)
                
                # Convert to DataFrame
                self.problems_df = pd.DataFrame(problems)
                
                # Save problems data
                with open(PROBLEMS_PATH, 'w') as f:
                    json.dump(problems, f)
                
                self.last_update = time.time()
                return True
            else:
                print(f"API Error: {data.get('comment', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"Error fetching problems: {e}")
            return False
    
    def create_tfidf_vectorizer(self):
        """Create and fit TF-IDF vectorizer on problem tags."""
        if self.problems_df is None or 'tags' not in self.problems_df.columns:
            print("Problem data not available or missing tags")
            return False
        
        # Create text representation of tags
        self.problems_df['tags_text'] = self.problems_df['tags'].apply(lambda x: ' '.join(x))
        
        # Fit TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(max_features=100)
        self.tfidf_vectorizer.fit(self.problems_df['tags_text'].values)
        
        # Save the vectorizer
        joblib.dump(self.tfidf_vectorizer, TFIDF_MODEL_PATH)
        
        # Process problem features
        self.process_problem_features()
        return True
    
    def process_problem_features(self):
        """Process problem features to create problem vectors."""
        if self.problems_df is None or self.tfidf_vectorizer is None:
            return False
        
        # Ensure tags_text is available
        if 'tags_text' not in self.problems_df.columns:
            self.problems_df['tags_text'] = self.problems_df['tags'].apply(lambda x: ' '.join(x))
        
        # Transform tags to TF-IDF vectors
        tags_tfidf = self.tfidf_vectorizer.transform(self.problems_df['tags_text'].values)
        
        # Scale rating
        rating_scaler = MinMaxScaler()
        ratings = self.problems_df['rating'].fillna(1500).values.reshape(-1, 1)
        ratings_scaled = rating_scaler.fit_transform(ratings)
        
        # Scale solved count
        solved_scaler = MinMaxScaler()
        solved_counts = self.problems_df['solvedCount'].fillna(0).values.reshape(-1, 1)
        solved_scaled = solved_scaler.fit_transform(solved_counts)
        
        # Combine features (tags, rating, solved count)
        self.problem_vectors = np.hstack([
            tags_tfidf.toarray(),
            ratings_scaled,
            solved_scaled
        ])
        
        return True
    
    def create_user_vector(self, user_handle):
        """Create or update a user's feature vector based on their solved problems."""
        try:
            # Fetch user's submissions
            response = requests.get(f'https://codeforces.com/api/user.status?handle={user_handle}')
            data = response.json()
            
            if data['status'] != 'OK':
                print(f"API Error: {data.get('comment', 'Unknown error')}")
                return None
            
            submissions = data['result']
            
            # Get accepted submissions
            accepted_submissions = [sub for sub in submissions if sub['verdict'] == 'OK']
            
            # Create a set of solved problem IDs
            solved_problems = set()
            for sub in accepted_submissions:
                problem_id = f"{sub['problem']['contestId']}_{sub['problem']['index']}"
                solved_problems.add(problem_id)
            
            # If user hasn't solved any problems, return a default vector
            if not solved_problems:
                # Default vector: average of all problem vectors
                user_vector = np.mean(self.problem_vectors, axis=0)
            else:
                # Find indices of solved problems in the problems_df
                problem_indices = []
                for idx, row in self.problems_df.iterrows():
                    problem_id = f"{row['contestId']}_{row['index']}"
                    if problem_id in solved_problems:
                        problem_indices.append(idx)
                
                # If no solved problems are found in our dataset, return default
                if not problem_indices:
                    user_vector = np.mean(self.problem_vectors, axis=0)
                else:
                    # User vector is the average of their solved problem vectors
                    user_problem_vectors = self.problem_vectors[problem_indices]
                    user_vector = np.mean(user_problem_vectors, axis=0)
            
            # Save user vector
            self.user_vectors[user_handle] = user_vector.tolist()
            with open(USER_VECTORS_PATH, 'w') as f:
                json.dump(self.user_vectors, f)
            
            return user_vector
        except Exception as e:
            print(f"Error creating user vector: {e}")
            return None
    
    def get_recommendations(self, user_handle, n_recommendations=10, min_rating=None, max_rating=None, tags=None):
        """Get problem recommendations for a user."""
        # Get or create user vector
        if user_handle in self.user_vectors and isinstance(self.user_vectors[user_handle], list):
            user_vector = np.array(self.user_vectors[user_handle])
        else:
            user_vector = self.create_user_vector(user_handle)
            if user_vector is None:
                return []
        
        # Calculate similarity scores
        similarity_scores = cosine_similarity([user_vector], self.problem_vectors)[0]
        
        # Get user's solved problems
        try:
            response = requests.get(f'https://codeforces.com/api/user.status?handle={user_handle}')
            data = response.json()
            
            if data['status'] != 'OK':
                print(f"API Error: {data.get('comment', 'Unknown error')}")
                solved_problems = set()
            else:
                submissions = data['result']
                accepted_submissions = [sub for sub in submissions if sub['verdict'] == 'OK']
                solved_problems = set()
                for sub in accepted_submissions:
                    problem_id = f"{sub['problem']['contestId']}_{sub['problem']['index']}"
                    solved_problems.add(problem_id)
        except Exception as e:
            print(f"Error fetching user submissions: {e}")
            solved_problems = set()
        
        # Create recommendation DataFrame
        recommendations_df = self.problems_df.copy()
        recommendations_df['similarity'] = similarity_scores
        
        # Filter out solved problems
        recommendations_df['problem_id'] = recommendations_df.apply(
            lambda row: f"{row['contestId']}_{row['index']}", axis=1
        )
        recommendations_df = recommendations_df[~recommendations_df['problem_id'].isin(solved_problems)]
        
        # Apply additional filters
        if min_rating is not None:
            recommendations_df = recommendations_df[recommendations_df['rating'] >= min_rating]
        
        if max_rating is not None:
            recommendations_df = recommendations_df[recommendations_df['rating'] <= max_rating]
        
        if tags is not None:
            recommendations_df = recommendations_df[
                recommendations_df['tags'].apply(lambda x: any(tag in x for tag in tags))
            ]
        
        # Sort by similarity and get top N
        recommendations_df = recommendations_df.sort_values('similarity', ascending=False)
        top_recommendations = recommendations_df.head(n_recommendations)
        
        # Convert to list of dictionaries
        recommendations = top_recommendations.to_dict('records')
        
        return recommendations

# Create recommender instance
recommender = CodeforcesRecommender()

@app.route('/recommend', methods=['GET'])
def recommend():
    """API endpoint to get recommendations."""
    user_handle = request.args.get('handle')
    if not user_handle:
        return jsonify({"error": "User handle is required"}), 400
    
    n_recommendations = int(request.args.get('count', 10))
    min_rating = request.args.get('min_rating')
    max_rating = request.args.get('max_rating')
    tags = request.args.get('tags')
    
    if min_rating:
        min_rating = int(min_rating)
    if max_rating:
        max_rating = int(max_rating)
    if tags:
        tags = tags.split(',')
    
    recommendations = recommender.get_recommendations(
        user_handle=user_handle,
        n_recommendations=n_recommendations,
        min_rating=min_rating,
        max_rating=max_rating,
        tags=tags
    )
    
    return jsonify({"recommendations": recommendations})

@app.route('/refresh', methods=['POST'])
def refresh():
    """API endpoint to refresh problem data."""
    success = recommender.fetch_problems()
    if success:
        recommender.process_problem_features()
        return jsonify({"status": "success", "message": "Problem data refreshed"})
    else:
        return jsonify({"status": "error", "message": "Failed to refresh problem data"}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "version": "1.0.0"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
