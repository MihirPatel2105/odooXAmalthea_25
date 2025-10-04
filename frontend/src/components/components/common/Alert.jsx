import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/helpers';

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = ''
}) => {
  const types = {
    success: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
      icon: CheckCircleIcon
    },
    warning: {
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
      icon: ExclamationTriangleIcon
    },
    error: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
      icon: XCircleIcon
    },
    info: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-400',
      icon: InformationCircleIcon
    }
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={classNames(
      'rounded-md p-4',
      config.bgColor,
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={classNames('h-5 w-5', config.iconColor)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={classNames('text-sm font-medium', config.textColor)}>
              {title}
            </h3>
          )}
          {message && (
            <div className={classNames(
              'text-sm',
              config.textColor,
              title ? 'mt-2' : ''
            )}>
              {message}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={classNames(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  config.textColor,
                  'hover:bg-opacity-20'
                )}
                onClick={onClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
