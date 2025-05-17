import React from "react";
import "./DeleteProjectDialog.css";
import { motion } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectType: string;
}

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectType,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="delete-project-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="delete-project-dialog"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        <div className="delete-dialog-header">
          <FaExclamationTriangle className="warning-icon" />
          <h2>Delete Project</h2>
        </div>
        <div className="delete-dialog-content">
          <p>
            Are you sure you want to delete your <strong>{projectType}</strong>{" "}
            project?
          </p>
          <p className="warning-text">
            This will permanently delete all project data, messages, and
            progress. This action cannot be undone.
          </p>
        </div>
        <div className="delete-project-actions">
          <motion.button
            className="cancel-button"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            className="delete-button"
            onClick={onConfirm}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Delete Project
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeleteProjectDialog;
