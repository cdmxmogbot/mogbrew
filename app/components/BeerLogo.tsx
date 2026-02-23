import { useState } from 'react';
import { BEER_LOGOS, BRAND_META } from '~/lib/beers';

interface BeerLogoProps {
  beerName: string;
  brand: string;
  size?: "sm" | "md" | "lg";
}

export function BeerLogo({ beerName, brand, size = "md" }: BeerLogoProps) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = BEER_LOGOS[beerName];
  const meta = BRAND_META[brand] ?? { color: "#22c55e", abbr: brand.slice(0, 2).toUpperCase() };

  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base"
  }[size];

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={beerName}
        className={`${sizeClass} object-contain rounded-lg`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: colored brand badge
  return (
    <div
      className={`${sizeClass} rounded-xl flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: meta.color }}
    >
      {meta.abbr}
    </div>
  );
}
