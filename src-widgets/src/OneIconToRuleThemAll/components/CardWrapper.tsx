import React from 'react';
import { Box } from '@mui/material';

export interface CardWrapperProps {
    showCard: boolean;
    backgroundColor?: string;
    borderRadiusTL?: number;
    borderRadiusTR?: number;
    borderRadiusBL?: number;
    borderRadiusBR?: number;
    usedInWidget?: boolean;
    children: React.ReactNode;
}

export const CardWrapper: React.FC<CardWrapperProps> = React.memo(
    ({
        showCard,
        backgroundColor = '#ffffff',
        borderRadiusTL = 8,
        borderRadiusTR = 8,
        borderRadiusBL = 8,
        borderRadiusBR = 8,
        usedInWidget = false,
        children,
    }) => {
        if (!showCard || usedInWidget) {
            return <>{children}</>;
        }

        return (
            <Box
                sx={{
                    backgroundColor,
                    borderTopLeftRadius: `${borderRadiusTL}px`,
                    borderTopRightRadius: `${borderRadiusTR}px`,
                    borderBottomLeftRadius: `${borderRadiusBL}px`,
                    borderBottomRightRadius: `${borderRadiusBR}px`,
                    boxShadow: 1,
                    height: '100%',
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0,
                }}
            >
                {children}
            </Box>
        );
    },
);

CardWrapper.displayName = 'CardWrapper';
