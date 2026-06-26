/**
 * Payment brand marks — inline SVG, no external image assets.
 */
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { CardBrand } from '@/services/payment-methods';

interface BrandIconProps {
  width?: number;
  height?: number;
}

export function VisaIcon({ width = 40, height = 26 }: BrandIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 40 26" fill="none">
      <Rect width={40} height={26} rx={5} fill="#1A3B8B" />
      <SvgText x={20} y={17.5} fontSize={11} fontWeight="bold" fill="#fff" textAnchor="middle" fontStyle="italic">
        VISA
      </SvgText>
    </Svg>
  );
}

export function MastercardIcon({ width = 40, height = 26 }: BrandIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 40 26" fill="none">
      <Rect width={40} height={26} rx={5} fill="#16191F" />
      <Circle cx={16.5} cy={13} r={7.2} fill="#EB001B" />
      <Circle cx={23.5} cy={13} r={7.2} fill="#F79E1B" fillOpacity={0.9} />
    </Svg>
  );
}

export function AmexIcon({ width = 40, height = 26 }: BrandIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 40 26" fill="none">
      <Rect width={40} height={26} rx={5} fill="#2566AF" />
      <SvgText x={20} y={17} fontSize={9} fontWeight="bold" fill="#fff" textAnchor="middle">
        AMEX
      </SvgText>
    </Svg>
  );
}

export function GenericCardIcon({ width = 40, height = 26 }: BrandIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 40 26" fill="none">
      <Rect width={40} height={26} rx={5} fill="#3A3D45" />
      <Rect x={4} y={8} width={32} height={3} rx={1} fill="#fff" fillOpacity={0.6} />
      <Rect x={4} y={15} width={14} height={2.5} rx={1} fill="#fff" fillOpacity={0.4} />
    </Svg>
  );
}

export function ApplePayIcon({ width = 50, height = 26 }: BrandIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 50 26" fill="none">
      <Rect width={50} height={26} rx={5} fill="#000" />
      <Path
        d="M14.6 8.4c-.5.6-1.3 1.1-2.1 1-.1-.8.3-1.7.7-2.2.5-.6 1.4-1.1 2.1-1.1.1.9-.3 1.7-.7 2.3zm.7 1.1c-1.2-.1-2.2.7-2.8.7-.6 0-1.4-.6-2.4-.6-1.2 0-2.5.7-3.3 2-.9 1.4-.5 4 .6 5.8.5.8 1.1 1.7 1.9 1.6.7 0 1-.5 1.9-.5.9 0 1.2.5 1.9.5.8 0 1.3-.8 1.9-1.6.3-.4.4-.7.7-1.2-1.8-.7-2.1-3.3-.4-4.4-.5-.7-1.3-1.2-2-1.3z"
        fill="#fff"
      />
      <SvgText x={32} y={17} fontSize={10} fontWeight="600" fill="#fff" textAnchor="middle">
        Pay
      </SvgText>
    </Svg>
  );
}

export function PayPalIcon({ width = 50, height = 26 }: BrandIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 50 26" fill="none">
      <Rect width={50} height={26} rx={5} fill="#fff" />
      <SvgText x={13} y={17} fontSize={11} fontWeight="bold" fill="#003087" fontStyle="italic">
        Pay
      </SvgText>
      <SvgText x={30} y={17} fontSize={11} fontWeight="bold" fill="#0070BA" fontStyle="italic">
        Pal
      </SvgText>
    </Svg>
  );
}

export function CardBrandIcon({ brand, width, height }: { brand: CardBrand } & BrandIconProps) {
  if (brand === 'visa') return <VisaIcon width={width} height={height} />;
  if (brand === 'mastercard') return <MastercardIcon width={width} height={height} />;
  if (brand === 'amex') return <AmexIcon width={width} height={height} />;
  return <GenericCardIcon width={width} height={height} />;
}
