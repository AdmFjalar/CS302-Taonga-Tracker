import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/shared.css';

/**
 * Reusable Button component with consistent styling across the application
 *
 * @param {Object} props - Component props
 * @param {string} [props.variant="primary"] - Button style variant (primary, secondary, delete)
 * @param {boolean} [props.isLoading=false] - Whether the button is in loading state
 * @param {string} [props.loadingText] - Text to display when loading
 * @param {function} props.onClick - Click handler function
 * @param {string} [props.type="button"] - HTML button type
 * @param {React.ReactNode} props.children - Button label content
 * @returns {JSX.Element} Button component
 */
const Button = ({
  variant = 'primary',
  isLoading = false,
  loadingText,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  children,
  ...rest
}) => {
  // Generate CSS class based on variant
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const buttonClasses = [baseClass, variantClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={isLoading || disabled}
      {...rest}
    >
      {isLoading ? (loadingText || 'Loading...') : children}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'delete', 'outline']),
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default Button;
