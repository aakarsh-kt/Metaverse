import React from 'react';

interface GridProps {
  rows: number;
  columns: number;
  cellSize?: number; // Optional: Size of each cell in pixels
}

const Grid: React.FC<GridProps> = ({ rows, columns, cellSize = 50 }) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
    gap: '0px', // Optional: Space between grid items
   
  };

  return (
    <div style={gridStyle}>
      {Array.from({ length: rows * columns }).map((_, index) => (
        <div
          key={index}
          onClick={() => console.log(`Clicked cell ${Math.floor(index/columns)}x${index%columns}`)}
          className='hover:bg-blue-400'
          style={{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            border: '1px solid #ccc', // Optional: Border for each cell
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Content for each cell (optional) */}
        </div>
      ))}
    </div>
  );
};

export default Grid;
