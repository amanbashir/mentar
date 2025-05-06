import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "../../lib/businessDiscovery";
import "./Questionnaire.css";

const Questionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const project = location.state?.project;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill("")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getOptionsForQuestion = (index: number) => {
    switch (index) {
      case 0: // Capital
        return ["$0-500", "$500-2000", "$2000+"];
      case 1: // Time per week
        return ["0-10 hours", "10-20 hours", "20+ hours"];
      case 2: // Target profit
        return ["1-2k", "2-5k", "5k+"];
      case 3: // Natural skill
        return [
          "Writing compelling words",
          "Reaching out and selling",
          "Building tools or systems",
          "Running ads or a store",
          "Creating content online",
        ];
      case 4: // Open to sales
      case 5: // Content creation
      case 6: // Enjoy writing
      case 7: // Tech problem solving
        return ["Yes", "No"];
      case 8: // Client preference
        return ["Helping clients directly", "Selling products at scale"];
      case 9: // Team preference
        return ["Run solo", "Manage a small team"];
      default:
        return [];
    }
  };

  const handleOptionSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = option;
    setAnswers(newAnswers);

    // Automatically move to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    // Map answers to userAnswers object
    const userAnswers: Record<string, string> = {};
    [
      "capital",
      "timePerWeek",
      "targetProfit",
      "naturalSkill",
      "openToSales",
      "contentCreation",
      "enjoyWriting",
      "techProblemSolving",
      "clientPreference",
      "teamPreference",
    ].forEach((key, idx) => {
      userAnswers[key] = answers[idx];
    });
    navigate("/questionnaire/complete", { state: { userAnswers, project } });
  };

  return (
    <motion.div
      className="questionnaire-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="questionnaire-container"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Ask yourself these questions to find out what you should be doing
        </motion.h1> */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            className="question-section"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2>{questions[currentQuestionIndex]}</h2>
            <div className="options-container">
              {getOptionsForQuestion(currentQuestionIndex).map(
                (option, index) => (
                  <motion.label
                    key={index}
                    className="option-label"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={option}
                      checked={answers[currentQuestionIndex] === option}
                      onChange={() => handleOptionSelect(option)}
                      disabled={isSubmitting}
                    />
                    <span className="option-text">{option}</span>
                  </motion.label>
                )
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          <motion.button
            className="submit-button"
            onClick={handleBack}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back
          </motion.button>
          {currentQuestionIndex < questions.length - 1 ? (
            <motion.button
              className="submit-button"
              onClick={handleNext}
              disabled={!answers[currentQuestionIndex] || isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              className="submit-button"
              onClick={handleFinish}
              disabled={!answers[currentQuestionIndex] || isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Finish
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Questionnaire;
