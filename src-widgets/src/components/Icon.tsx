import React from 'react';
import { Box } from '@mui/material';

interface IconProps {
    src: string;
    style?: React.CSSProperties;
    alt?: string;
    className?: string;
    color?: string;
}

/**
 * Icon component that supports SVG and image rendering with color customization
 * Replacement for deprecated @iobroker/adapter-react-v5 Icon component
 */
const Icon: React.FC<IconProps> = ({ src, style = {}, alt = 'icon', className, color }) => {
    const isSvgDataUrl = src.startsWith('data:image/svg');

    // Helper function to prepare SVG for color customization via CSS
    const prepareSvg = (svgString: string): string => {
        // Remove embedded <style> tags that override currentColor
        return svgString.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    };

    const decodeSvg = (dataUrl: string): string => {
        if (dataUrl.includes('base64,')) {
            return atob(dataUrl.split('base64,')[1]);
        }
        return decodeURIComponent(dataUrl.replace('data:image/svg+xml,', '').replace('data:image/svg+xml;utf8,', ''));
    };

    if (isSvgDataUrl && color) {
        // SVG with color customization via CSS color property
        const svgString = decodeSvg(src);
        const preparedSvg = prepareSvg(svgString);

        return (
            <Box
                className={className}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color, // Set CSS color for currentColor to work
                    '& svg': {
                        width: style.width || 28,
                        height: style.height || style.width || 28,
                    },
                    ...style,
                }}
                dangerouslySetInnerHTML={{ __html: preparedSvg }}
            />
        );
    }

    if (isSvgDataUrl) {
        // SVG without color customization
        const svgString = decodeSvg(src);

        return (
            <Box
                className={className}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& svg': {
                        width: style.width || 28,
                        height: style.height || style.width || 28,
                    },
                    ...style,
                }}
                dangerouslySetInnerHTML={{ __html: svgString }}
            />
        );
    }

    // Regular image
    return (
        <Box
            component="img"
            src={src}
            alt={alt}
            className={className}
            sx={{
                width: style.width || 28,
                height: style.height || style.width || 28,
                objectFit: 'contain',
                ...style,
            }}
        />
    );
};

export default Icon;
