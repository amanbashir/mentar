import React from 'react';
import './TodoList.css';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
}

interface TodoListProps {
  modules: Module[];
  onTaskComplete: (moduleId: string, taskId: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ modules, onTaskComplete }) => {
  const calculateProgress = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  const totalTasks = modules.reduce((acc, module) => acc + module.tasks.length, 0);
  const completedTasks = modules.reduce(
    (acc, module) => acc + module.tasks.filter(task => task.completed).length,
    0
  );
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="todo-list">
      <div className="progress-section">
        <h2>Overall Progress</h2>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="progress-text">
          {completedTasks} of {totalTasks} tasks completed
        </div>
      </div>

      <div className="modules-section">
        <h2>Modules</h2>
        {modules.map(module => {
          const moduleProgress = calculateProgress(module.tasks);
          const isCompleted = moduleProgress === 100;

          return (
            <div key={module.id} className="module-card">
              <div className="module-header">
                <h3>{module.title}</h3>
                <span className={`module-status ${isCompleted ? 'completed' : ''}`}>
                  {isCompleted ? 'Completed' : `${Math.round(moduleProgress)}%`}
                </span>
              </div>
              <p className="module-description">{module.description}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${moduleProgress}%` }}
                />
              </div>
              <div className="tasks-list">
                {module.tasks.map(task => (
                  <div key={task.id} className="task-item">
                    <label className="task-checkbox">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onTaskComplete(module.id, task.id)}
                      />
                      <span className="checkmark" />
                    </label>
                    <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodoList; 