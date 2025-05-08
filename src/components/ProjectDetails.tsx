import React from "react";
import "./ProjectDetails.css";
import { Database } from "../types/supabase";

type ProjectData = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectDetailsProps {
  data: ProjectData;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ data }) => {
  return (
    <div className="project-details">
      <h2>Project Details</h2>
      <div className="details-grid">
        <div className="detail-item">
          <h3>Business Idea</h3>
          <p>{data.business_idea || "Not specified"}</p>
        </div>
        <div className="detail-item">
          <h3>Brief Summary</h3>
          <p>{data.brief_summary || "Not specified"}</p>
        </div>
        <div className="detail-item">
          <h3>Budget & Goals</h3>
          <p>
            Total Budget: $
            {data.total_budget?.toLocaleString() || "Not specified"}
          </p>
          <p>
            Income Goal: $
            {data.income_goal?.toLocaleString() || "Not specified"}
          </p>
        </div>
        <div className="detail-item">
          <h3>Timeline</h3>
          <p>Expected Launch: {data.expected_launch_date || "Not specified"}</p>
        </div>
        <div className="detail-item todo-list">
          <h3>Action Items</h3>
          <ul>
            <li className={data.todo_1 ? "completed" : ""}>
              {data.todo_1 || "Not specified"}
            </li>
            <li className={data.todo_2 ? "completed" : ""}>
              {data.todo_2 || "Not specified"}
            </li>
            <li className={data.todo_3 ? "completed" : ""}>
              {data.todo_3 || "Not specified"}
            </li>
            <li className={data.todo_4 ? "completed" : ""}>
              {data.todo_4 || "Not specified"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
