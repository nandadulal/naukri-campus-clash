import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameCompleteModal from "./GameCompleteModal.jsx";
import "./vibe.css"; // custom CSS

// const questions = [
//   {
//     id: 1,
//     question:
//       "It's Friday at 5 PM and your boss asks you to finish an urgent task that could take 2 hours.",
//     options: [
//       "Stay late and get it done - work comes first!",
//       "Politely explain you'll handle it first thing Monday morning",
//     ],
//   },
//   {
//     id: 2,
//     question: "Your teammate missed a deadline. What do you do?",
//     options: [
//       "Step in and help them catch up",
//       "Let them handle it — everyone owns their work",
//     ],
//   },
//   {
//     id: 3,
//     question: "You’re asked to present on short notice. Do you?",
//     options: ["Take it on confidently", "Ask for more time to prepare"],
//   },
//   {
//     id: 4,
//     question: "You get negative feedback on your work. What’s your response?",
//     options: ["Thank them and improve", "Defend your choices"],
//   },
//   {
//     id: 5,
//     question: "You’re given a project outside your expertise. Do you?",
//     options: [
//       "Take it as a learning challenge",
//       "Request to stick with what you know",
//     ],
//   },
// ];

export default function Vibe() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    async function fetchQuestions() {
      // Reset answers when component mounts
      const response = await fetch("https://central8.dev.sg1.chsh.in/gamification/api/api/games/vibe-sets/");
      if (!response.ok) {
        console.log("Failed to fetch questions");
        return;
      }
      const data = await response.json();
      setQuestions(data.sets);
    }
    fetchQuestions();
  }, []);
  const handleOptionClick = (option) => {
    setAnswers({ ...answers, [current]: option });
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      fetch("https://central8.dev.sg1.chsh.in/gamification/api/api/games/update-score/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: localStorage.getItem("user_name"),
          game_name: "vibe",
          batch: "batch1",
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setOpenModal(true);
          console.log("Response:", data);
        })
        .catch((err) => {
          console.error("Error:", err);
        });
      // const response = await fetch("https://central8.dev.sg1.chsh.in/gamification/api/api/user/");
      // alert("Quiz Completed! " + JSON.stringify(answers, null, 2));
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setOpenModal(true);
      // alert("Quiz Completed! " + JSON.stringify(answers, null, 2));
    }
  };

  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Question Box with animation */}
      {questions && questions.length && (<AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="question-box"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="question-title">Question {current + 1}</h2>
          <p className="question-text">{questions[current].question}</p>

          {/* Options */}
          <div className="options">
            {questions[current].answers.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(option.text)}
                className={`option-btn ${answers[current] === option.text ? "selected" : ""
                  }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>)}
      {openModal && (<GameCompleteModal xpValue={10 * questions.length} pathFinder="GenZ Approved!" completedCareerNavigation="Your vibes are off the roof" onContinueGaming={() => {
        window.location.href = "/"; // Redirect to home or another page
        setOpenModal(false)
      }} onClose={() => {
        window.location.href = "/";
        setOpenModal(false)
      }} />)}
    </div>
  );
}
