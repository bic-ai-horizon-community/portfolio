import React, { useState } from 'react';
import styles from './RegistrationForm.module.css';

export interface FormField {
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'number';
  required: boolean;
  options?: string[];
}

interface RegistrationFormProps {
  fields: FormField[];
  onSubmit: (responses: Record<string, any>) => Promise<void>;
  loading: boolean;
  error: string;
  initialValues?: Record<string, any>;
  buttonText?: string;
  onCancel?: () => void;
}

export const RegistrationForm = ({ fields, onSubmit, loading, error, initialValues = {}, buttonText = "Submit", onCancel }: RegistrationFormProps) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (label: string, value: any) => {
    setValues(prev => ({ ...prev, [label]: value }));
    if (validationErrors[label]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[label];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required) {
        const val = values[field.label];
        if (val === undefined || val === null || val === '' || (field.type === 'checkbox' && !val)) {
          errors[field.label] = 'This field is required';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    await onSubmit(values);
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      {error && <p className={styles.submitError}>{error}</p>}
      
      {fields.map((field, index) => (
        <div key={index} className={styles.fieldGroup}>
          <label className={styles.label}>
            {field.label} {field.required && <span className={styles.asterisk}>*</span>}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea
              className={styles.input}
              value={values[field.label] || ''}
              onChange={(e) => handleChange(field.label, e.target.value)}
            />
          ) : field.type === 'select' ? (
            <select
              className={styles.input}
              value={values[field.label] || ''}
              onChange={(e) => handleChange(field.label, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={!!values[field.label]}
              onChange={(e) => handleChange(field.label, e.target.checked)}
            />
          ) : (
            <input
              type={field.type === 'phone' ? 'tel' : field.type}
              className={styles.input}
              value={values[field.label] || ''}
              onChange={(e) => handleChange(field.label, e.target.value)}
            />
          )}
          
          {validationErrors[field.label] && (
            <p className={styles.errorText}>{validationErrors[field.label]}</p>
          )}
        </div>
      ))}
      
      <div className={styles.buttonGroup}>
        {onCancel && (
          <button 
            type="button" 
            className={`btn-secondary ${styles.cancelButton}`}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          className={`btn-primary ${styles.submitButton}`} 
          disabled={loading}
        >
          {loading ? 'Processing…' : buttonText}
        </button>
      </div>
    </form>
  );
};
