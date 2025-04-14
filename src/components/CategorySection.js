import React, { useState, useEffect, useRef } from 'react';
import { Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const CategorySection = ({ title, items, type, onCategoryClick, getIcon }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    checkScroll();
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <Typography variant="h2" className="section-title">
          {title}
        </Typography>
      </div>
      <div className="cards-container">
        {showLeftArrow && (
          <div className="scroll-button left" onClick={() => scroll('left')}>
            <ChevronLeftIcon />
          </div>
        )}
        <div 
          className="cards-row"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {items.map((item) => (
            <div
              key={item}
              className="category-card"
              onClick={() => onCategoryClick(type, item)}
            >
              <div className="category-icon">
                {getIcon(type, item)}
              </div>
              <div className="category-text">
                <Typography className="category-name">{item}</Typography>
                <Typography className="category-count">
                  View exercises
                </Typography>
              </div>
            </div>
          ))}
        </div>
        {showRightArrow && (
          <div className="scroll-button right" onClick={() => scroll('right')}>
            <ChevronRightIcon />
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection; 