const mockData = {
  games: [
    {
      id: 1,
      title: "Vibe Check",
      company: "Amazon",
      duration: "1-2 min",
      description: "Make 5 quick choices to reveal your 'vibe'",
      category: "Logic",
      gradient: "from-blue-400 to-purple-600",
      played: "1k played",
      rating: "4.5★",
      url: "/gamification-ui/vibe",
      logo: "Amazon"
    },
    {
      id: 2,
      title: "Conversify-Ai Simulation",
      company: "Airtel",
      duration: "4-5 min",
      description: "Navigate career paths and make strategic decisions",
      category: "Strategy",
      gradient: "from-emerald-400 to-teal-600",
      played: "2.5k played",
      rating: "4.1★",
      logo: "Airtel",
      url: "/gamification-ui/audio-chat"
    },
    {
      id: 3,
      title: "Word Search Hunt",
      company: "Intel",
      duration: "4-5 min",
      description: "Find hidden words and boost your vocabulary",
      category: "Vocabulary",
      played: "400 played",
      rating: "4.3★",
      logo: "Intel",
      gradient: "from-orange-400 to-red-600"
    },
    {
      id: 4,
      title: "Guesstimate Arena",
      company: "BCG",
      duration: "3-4 min",
      description: "Master the art of quick calculations and estimates",
      category: "Math",
      rating: "4.7★",
      played: "870 played",
      logo: "BCG",
      gradient: "from-pink-400 to-rose-600"
    },
    {
      id: 5,
      title: "Crossword Challenge",
      company: "Cred",
      duration: "4-5 min",
      description: "Solve crossword puzzles to enhance your knowledge",
      category: "General Knowledge",
      played: "1k played",
      rating: "4.6★",
      logo: "Cred",
      gradient: "from-indigo-400 to-blue-600"
    }
  ],
  users: [
    {
      id: 1,
      name: "Ananya Sharma",
      campus: "IIT Bombay",
      rank: 1,
      score: 2847,
      streak: 15,
      badges: ["Top Performer", "Consistency King"]
    },
    {
      id: 2,
      name: "Arjun Patel", 
      campus: "IIM Ahmedabad",
      rank: 2,
      score: 2698,
      streak: 12,
      badges: ["Strategy Master"]
    },
    {
      id: 3,
      name: "Priya Singh",
      campus: "BITS Pilani",
      rank: 3,
      score: 2543,
      streak: 9,
      badges: ["Logic Expert"]
    },
    {
      id: 4,
      name: "Rohit Kumar",
      campus: "NIT Trichy",
      rank: 8,
      score: 2156,
      streak: 7,
      badges: ["Rising Star"]
    }
  ],
  posts: [
    {
      id: 1,
      user: "Ananya Sharma",
      campus: "IIT Bombay",
      content: "Mohit Chauhan is coming to Mood Indigo at IITB! 🎵 This is going to be absolutely insane! Who else is hyped?",
      likes: 23,
      comments: ["OMG YES! Already got my tickets 🎫", "Tips please! The timer stress is real"],
      timeAgo: "2h",
      anonymous: false
    },
    {
      id: 2,
      user: "Anonymous",
      campus: "Anonymous",
      content: "Real talk: XLRI Delhi placements are nowhere near XLRI main campus numbers 📊 Anyone else feeling this? The brand value hits different at Jamshedpur ngl",
      likes: 45,
      comments: ["So true! The scenarios are so realistic", "Facts! Should be mandatory for all students"],
      timeAgo: "4h",
      anonymous: true
    },
    {
      id: 3,
      user: "Priya Singh",
      campus: "BITS Pilani",
      content: "DU fest season is here and I'm already broke from all the events 😂 Shoutout to everyone organizing these amazing fests! The energy is unmatched 🔥",
      likes: 67,
      comments: ["Mood! But honestly these games are more useful", "Same energy 😭"],
      timeAgo: "6h",
      anonymous: false
    }
  ],
  currentUser: {
    id: 4,
    name: "Rohit Kumar",
    campus: "NIT Trichy",
    rank: 8,
    score: 2156,
    streak: 7,
    badges: ["Rising Star", "Word Wizard", "Quick Thinker"],
    gamesPlayed: 34,
    totalXP: 2156
  }
};

export default mockData;