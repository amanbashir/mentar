import React from 'react';

interface IndustryOptionsProps {
  onSelect: (industry: string) => void;
}

const IndustryOptions: React.FC<IndustryOptionsProps> = ({ onSelect }) => {
  const industries = [
    'Ecommerce',
    'SAAS (Software as a service)',
    'Copywriting',
    'Media Buying'
  ];

  return (
    <div className="flex flex-col gap-2 mt-2">
      {industries.map((industry) => (
        <button
          key={industry}
          onClick={() => onSelect(industry)}
          className="p-3 text-left rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
        >
          {industry}
        </button>
      ))}
    </div>
  );
};

export default IndustryOptions; 