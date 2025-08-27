# Codeforces ML Recommender

This is a machine learning-based recommendation system for Codeforces problems.

## Features

- Uses collaborative filtering and content-based recommendations
- TF-IDF vectorization of problem tags
- Cosine similarity for problem recommendations
- Factors in problem difficulty, tags, and popularity
- REST API for integration with the main application

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Start the server:

```bash
python recommender.py
```

## API Endpoints

### Get Recommendations

```
GET /recommend?handle=user_handle&count=10&min_rating=800&max_rating=2000&tags=greedy,dp
```

Parameters:
- `handle`: User handle (required)
- `count`: Number of recommendations (optional, default: 10)
- `min_rating`: Minimum problem rating (optional)
- `max_rating`: Maximum problem rating (optional)
- `tags`: Comma-separated list of tags (optional)

### Refresh Problem Data

```
POST /refresh
```

Refreshes the problem data from the Codeforces API.

### Health Check

```
GET /health
```

Returns the health status of the service.
