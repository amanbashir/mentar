import React from 'react';
import './TextContentTitle.css';

interface TextContentTitleProps {
  title: string;
  subtitle: string;
  align?: 'center' | 'left' | 'right';
}

const TextContentTitle: React.FC<TextContentTitleProps> = ({ 
  title, 
  subtitle, 
  align = 'center' 
}) => {
  return (
    <div className={`text-content-title text-${align}`}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
};

export default TextContentTitle; 