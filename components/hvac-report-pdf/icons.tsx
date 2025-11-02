import React from 'react';

export const SzutestLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect x="10" y="10" width="80" height="80" fill="#E0E0E0"/>
        <path d="M20 50 L40 20 L60 50 L40 80 Z" fill="#FF0000"/>
        <circle cx="70" cy="30" r="15" fill="#0000FF"/>
        <text x="50" y="70" font-family="Arial" font-size="10" fill="black" text-anchor="middle">SZUTEST</text>
    </svg>
);

export const TurkakLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect x="10" y="10" width="80" height="80" fill="#E0E0E0"/>
        <circle cx="50" cy="50" r="30" fill="#008000"/>
        <text x="50" y="55" font-family="Arial" font-size="12" fill="white" text-anchor="middle">TÜRKAK</text>
    </svg>
);
