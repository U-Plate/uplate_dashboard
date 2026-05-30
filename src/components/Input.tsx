import React from 'react';
import './Input.css';

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
}) => {
  const className = `input ${type === 'number' ? 'input--number' : ''} ${type === 'checkbox' ? 'input--checkbox' : ''}`;

  return (
    <label className="input__label">
      {label}
      <input
        className={className}
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'checkbox' ? (e.target.checked ? "true" : "false") : e.target.value  )}
        placeholder={placeholder}
        checked={type === 'checkbox' ? value === "true" : undefined}
      />
    </label>
  );
};
