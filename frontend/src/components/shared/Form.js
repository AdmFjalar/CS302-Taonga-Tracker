import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import '../../styles/shared.css';

/**
 * Form input component with consistent styling and validation.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID for label association
 * @param {string} props.label - Input label text
 * @param {string} [props.type='text'] - Input type
 * @param {string} props.name - Input name attribute
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.required=false] - Required field indicator
 * @param {boolean} [props.disabled=false] - Disabled state
 * @returns {JSX.Element} Form input component
 */
export const FormInput = ({
  id,
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  ...rest
}) => (
  <div className="form-column">
    <label htmlFor={id}>
      {label}
      {required && <span className="required">*</span>}
    </label>
    <input
      id={id}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={error ? 'input-error' : ''}
      {...rest}
    />
    {error && <div className="error-text">{error}</div>}
  </div>
);

/**
 * Form textarea component with consistent styling.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Textarea ID for label association
 * @param {string} props.label - Textarea label text
 * @param {string} props.name - Textarea name attribute
 * @param {string} props.value - Textarea value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.placeholder] - Textarea placeholder
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.required=false] - Required field indicator
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {number} [props.rows=4] - Number of visible rows
 * @returns {JSX.Element} Form textarea component
 */
export const FormTextarea = ({
  id,
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  rows = 4,
  ...rest
}) => (
  <div className="form-column">
    <label htmlFor={id}>
      {label}
      {required && <span className="required">*</span>}
    </label>
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      className={error ? 'input-error' : ''}
      {...rest}
    />
    {error && <div className="error-text">{error}</div>}
  </div>
);

/**
 * Form select component with consistent styling.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Select ID for label association
 * @param {string} props.label - Select label text
 * @param {string} props.name - Select name attribute
 * @param {string} props.value - Selected value
 * @param {function} props.onChange - Change handler
 * @param {Array} props.options - Array of option objects {value, label}
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.required=false] - Required field indicator
 * @param {boolean} [props.disabled=false] - Disabled state
 * @returns {JSX.Element} Form select component
 */
export const FormSelect = ({
  id,
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  ...rest
}) => (
  <div className="form-column">
    <label htmlFor={id}>
      {label}
      {required && <span className="required">*</span>}
    </label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={error ? 'input-error' : ''}
      {...rest}
    >
      <option value="">Select {label}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <div className="error-text">{error}</div>}
  </div>
);

/**
 * Form component wrapper with submit handling.
 *
 * @param {Object} props - Component props
 * @param {function} props.onSubmit - Form submit handler
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Form content
 * @returns {JSX.Element} Form wrapper component
 */
export const Form = ({ onSubmit, className = '', children, ...rest }) => (
  <form
    onSubmit={onSubmit}
    className={`form ${className}`.trim()}
    {...rest}
  >
    {children}
  </form>
);

// PropTypes definitions
FormInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};

FormTextarea.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  rows: PropTypes.number
};

FormSelect.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};
