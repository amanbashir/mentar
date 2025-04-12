import React, { useState } from 'react';
import './BusinessOverview.css';

interface BusinessOverviewProps {
  businessType: string;
  budget: string;
  onBudgetChange: (newBudget: string) => void;
}

const BusinessOverview: React.FC<BusinessOverviewProps> = ({ 
  businessType, 
  budget, 
  onBudgetChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBudgetChange(tempBudget);
    setIsEditing(false);
  };

  return (
    <div className="business-overview">
      <h2>Business Overview</h2>
      
      <div className="overview-section">
        <h3>Business Type</h3>
        <p className="business-type">{businessType}</p>
      </div>
      
      <div className="overview-section">
        <h3>Budget</h3>
        {isEditing ? (
          <form onSubmit={handleBudgetSubmit} className="budget-edit-form">
            <input
              type="text"
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              placeholder="Enter budget"
              className="budget-input"
            />
            <div className="budget-actions">
              <button type="submit" className="save-btn">Save</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setTempBudget(budget);
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="budget-display">
            <p>{budget}</p>
            <button 
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessOverview; 