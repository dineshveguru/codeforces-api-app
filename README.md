# CodeFit - Codeforces Fitness Tracker

CodeFit is a web application that visualizes your Codeforces profile data in a fitness tracker-like interface. It transforms your coding activity into a workout analogy, making progress tracking more engaging and intuitive.

## Features

- **User Profile Overview**: View your current rating, rank, and max rating
- **Problem-Solving Streak**: Track your daily solving streak (like a workout streak)
- **Rating Progress**: Visualize your rating changes over time (like weight tracking)
- **Problem Difficulty Distribution**: See what difficulty levels you're solving (like workout intensity)
- **Weekly Activity Heatmap**: Track your consistency (like workout frequency)
- **Recent Submissions**: Check your latest submissions at a glance
- **Achievements System**: Earn badges for your coding milestones
- **ML-based Recommendations**: Get personalized problem recommendations using machine learning

## Technologies Used

- HTML, CSS, JavaScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Chart.js](https://www.chartjs.org/) for data visualization
- [Font Awesome](https://fontawesome.com/) for icons
- [Codeforces API](https://codeforces.com/apiHelp) for fetching user data
- [Flask](https://flask.palletsprojects.com/) for the ML recommendation server
- [scikit-learn](https://scikit-learn.org/) for machine learning algorithms

## How to Use

1. Clone this repository
2. Open `index.html` in your browser
3. Enter your Codeforces handle and click the search button
4. View your coding fitness stats and progress

### ML Recommendations

For advanced ML-based recommendations:

1. Navigate to the `ml/` directory
2. Install required packages: `pip install -r requirements.txt`
3. Start the ML server: `./start_ml_server.sh` or `python recommender.py`
4. Ensure ML recommendations are enabled in the settings panel

## Screenshots

(Add screenshots here once the application is running)

## License

MIT

## Credits

Created by [Your Name] - A project to make tracking Codeforces progress more fun and engaging.
