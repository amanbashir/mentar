import React, { ReactNode } from 'react';
import './Hero.css';

interface HeroProps {
  children: ReactNode;
  variant?: 'subtle' | 'default';
}

const Hero: React.FC<HeroProps> = ({ children, variant = 'default' }) => {
  return (
    <section className={`hero hero-${variant}`}>
      <div className="hero-content">
        {children}
      </div>
    </section>
  );
};

export default Hero; 