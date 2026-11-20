import React from 'react';

interface FoodSnapLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const FoodSnapLogo: React.FC<FoodSnapLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  const iconDimensions =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const textClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
        ? 'text-2xl sm:text-3xl'
        : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDimensions} shrink-0`}
        aria-hidden="true"
      >
        <rect width="44" height="44" rx="13" fill="#FFF4EC" />
        <rect
          x="0.75"
          y="0.75"
          width="42.5"
          height="42.5"
          rx="12.25"
          stroke="#FACAA8"
          strokeWidth="1.5"
        />
        {/* Viewfinder corners in soft orange */}
        <path
          d="M11 16.5V13.5C11 12.1193 12.1193 11 13.5 11H16.5"
          stroke="#E06528"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M27.5 11H30.5C31.8807 11 33 12.1193 33 13.5V16.5"
          stroke="#E06528"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M33 27.5V30.5C33 31.8807 31.8807 33 30.5 33H27.5"
          stroke="#E06528"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M16.5 33H13.5C12.1193 33 11 31.8807 11 30.5V27.5"
          stroke="#E06528"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Plate ring */}
        <circle cx="22" cy="23" r="6.5" fill="#DCEFE0" stroke="#3D8A51" strokeWidth="1.8" />
        {/* Fresh botanical leaf */}
        <path
          d="M22 25.5C22 21.8 24.4 19.2 27.8 18.8C27.5 22.3 25.2 25.2 22 25.5Z"
          fill="#3D8A51"
        />
        <path
          d="M22 25.5C20.2 23.2 18.5 22.2 16.8 22C17 24.4 19 25.8 22 25.5Z"
          fill="#7EC48E"
        />
      </svg>
      {showWordmark && (
        <span className={`font-display font-bold tracking-tight text-ink ${textClass}`}>
          Food<span className="italic font-semibold text-apricot-500">Snap</span>
        </span>
      )}
    </span>
  );
};
