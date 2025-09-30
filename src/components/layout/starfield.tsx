"use client";

import { useEffect } from 'react';

export default function Starfield() {
  useEffect(() => {
    const starfield = document.querySelector('.starfield');
    if (starfield) {
        // Clear existing stars before adding new ones
        starfield.innerHTML = '';
        for (let i = 0; i < 500; i++) {
            const star = document.createElement('span');
            star.style.left = `${Math.random() * 100}vw`;
            star.style.top = `${Math.random() * 100}vh`;
            const size = `${Math.random() * 2 + 1}px`;
            star.style.width = size;
            star.style.height = size;
            star.style.animationDelay = `${Math.random() * 15}s`;
            star.style.animationDuration = `${10 + Math.random() * 5}s`;
            starfield.appendChild(star);
        }
    }
  }, []);

  return <div className="starfield"></div>;
}
