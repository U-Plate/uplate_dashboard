import React from 'react';
import './FormField.css';

interface FormFieldProps {
  label: string;
  type: 'text' | 'number' | 'textarea';
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  value,
  onChange,
  error,
  required = false,
  placeholder,
}) => {
  const inputClassName = `form-field__input${error ? ' form-field__input--error' : ''}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(newValue);
  };

  return (
    <div className="form-field">
      <label className="form-field__label">
        {label}
        {required && <span className="form-field__required"> *</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          className={inputClassName}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          className={inputClassName}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
        />
      )}
      {error && <div className="form-field__error">{error}</div>}
    </div>
  );
};
