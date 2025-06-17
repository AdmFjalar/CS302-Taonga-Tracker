import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import '../../styles/shared.css';

/**
 * Form Input component with consistent styling
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID for label association
 * @param {string} props.label - Input label text
 * @param {string} props.type - Input type (text, email, password, etc)
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.error] - Error message
 * @param {boolean} [props.required] - Whether input is required
 * @param {boolean} [props.disabled] - Whether input is disabled
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
    <label htmlFor={id}>{label}{required && <span className="required">*</span>}</label>
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

FormInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};

/**
 * Form component with standard submit handling, validation, and layout
 *
 * @param {Object} props - Component props
 * @param {function} props.onSubmit - Submit handler
 * @param {React.ReactNode} props.children - Form children
 * @param {boolean} [props.loading] - Form submit loading state
 * @param {string} [props.submitText] - Submit button text
 * @param {string} [props.loadingText] - Loading text for submit button
 * @param {React.ReactNode} [props.footer] - Additional content for form footer
 * @returns {JSX.Element} Form component
 */
const Form = ({
  onSubmit,
  children,
  loading = false,
  submitText = 'Submit',
  loadingText = 'Submitting...',
  footer,
  className = '',
  ...rest
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`form ${className}`}
      noValidate
      {...rest}
    >
      <div className="form-content">
        {children}
      </div>

      <div className="form-footer">
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          loadingText={loadingText}
        >
          {submitText}
        </Button>
        {footer}
      </div>
    </form>
  );
};

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  submitText: PropTypes.string,
  loadingText: PropTypes.string,
  footer: PropTypes.node,
  className: PropTypes.string
};

export default Form;
