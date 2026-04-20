import { useCurrency } from '../../state/currency/CurrencyContext';
import { Typography, type TypographyProps } from '@mui/material';

interface PriceProps extends TypographyProps {
  usdAmount: number;
}

export function Price({ usdAmount, ...props }: PriceProps) {
  const { formatPrice } = useCurrency();
  return (
    <Typography component="span" {...props}>
      {formatPrice(usdAmount)}
    </Typography>
  );
}
