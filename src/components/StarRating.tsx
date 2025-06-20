'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showValue?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  showValue = false,
  onRatingChange,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isPartiallyFilled = starValue - 0.5 <= displayRating && starValue > displayRating;

          return (
            <button
              key={index}
              type="button"
              className={`
                ${sizeClasses[size]}
                ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                ${interactive ? 'text-yellow-400 hover:text-yellow-500' : ''}
              `}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
            >
              <Star
                className={`
                  w-full h-full
                  ${isFilled || isPartiallyFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'fill-gray-200 text-gray-200'
                  }
                  ${interactive && hoverRating >= starValue ? 'fill-yellow-500 text-yellow-500' : ''}
                `}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
} 