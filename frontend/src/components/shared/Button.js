import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/shared.css';

/**
 * Reusable button component with consistent styling and loading states.
 *
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button style variant
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.loadingText] - Text shown during loading
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.type='button'] - HTML button type
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {React.ReactNode} props.children - Button content
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
  const buttonClasses = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');

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
