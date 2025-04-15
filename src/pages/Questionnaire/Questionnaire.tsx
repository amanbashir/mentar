import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { questions } from '../../lib/businessDiscovery';
import './Questionnaire.css';

const Questionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const project = location.state?.project;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = e.target.value;
    setAnswers(newAnswers);
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
      'capital',
      'timePerWeek',
      'targetProfit',
      'naturalSkill',
      'openToSales',
      'contentCreation',
      'enjoyWriting',
      'techProblemSolving',
      'clientPreference',
      'teamPreference',
    ].forEach((key, idx) => {
      userAnswers[key] = answers[idx];
    });
    navigate('/questionnaire', { state: { userAnswers, project } });
  };

  return (
    <div className="questionnaire-page">
      <div className="questionnaire-container">
        <h1>Business Questionnaire</h1>
        <div className="question-section">
          <h2>{questions[currentQuestionIndex]}</h2>
          <textarea
            className="answer-input"
            value={answers[currentQuestionIndex]}
            onChange={handleInputChange}
            rows={3}
            disabled={isSubmitting}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          <button
            className="submit-button"
            onClick={handleBack}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            Back
          </button>
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              className="submit-button"
              onClick={handleNext}
              disabled={!answers[currentQuestionIndex] || isSubmitting}
            >
              Next
            </button>
          ) : (
            <button
              className="submit-button"
              onClick={handleFinish}
              disabled={!answers[currentQuestionIndex] || isSubmitting}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire; 