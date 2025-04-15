import React from 'react';
import { Database } from '../types/supabase';

type ProjectDetailsProps = {
  data: Database['public']['Tables']['userdata']['Row'];
};

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ data }) => {
  return (
    <div className="project-details">
      <h2>Project Details</h2>
      
      <div className="detail-section">
        <h3>Business Overview</h3>
        <p><strong>Business Idea:</strong> {data.business_idea || 'Not set'}</p>
        <p><strong>Brief Summary:</strong> {data.brief_summary || 'Not set'}</p>
      </div>

      <div className="detail-section">
        <h3>Financial Goals</h3>
        <p><strong>Total Budget:</strong> ${data.total_budget?.toLocaleString() || 'Not set'}</p>
        <p><strong>Income Goal:</strong> ${data.income_goal?.toLocaleString() || 'Not set'}</p>
      </div>

      <div className="detail-section">
        <h3>Timeline</h3>
        <p><strong>Expected Launch Date:</strong> {data.expected_launch_date || 'Not set'}</p>
      </div>

      <div className="detail-section">
        <h3>Todo List</h3>
        <ul>
          {data.todo_1 && <li>{data.todo_1}</li>}
          {data.todo_2 && <li>{data.todo_2}</li>}
          {data.todo_3 && <li>{data.todo_3}</li>}
          {data.todo_4 && <li>{data.todo_4}</li>}
        </ul>
      </div>
    </div>
  );
}; 