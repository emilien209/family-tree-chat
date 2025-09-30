"use client";

import { useEffect } from 'react';

export default function Starfield() {
  useEffect(() => {
    const starfield = document.querySelector('.starfield');
    if (starfield) {
        for (let i = 0; i < 500; i++) {
            const star = document.createElement('span');
            star.style.left = `${Math.random() * 100}vw`;
            star.style.top = `${Math.random() * 100}vh`;
            const size = `${Math.random() * 2 + 1}px`;
            star.style.width = size;
            star.style.height = size;
            star.style.animationDelay = `${Math.random() * 150}s`;
            star.style.animationDuration = `${150 - Math.random() * 50}s`;
            starfield.appendChild(star);
        }
    }
  }, []);

  return <div className="starfield"></div>;
}
