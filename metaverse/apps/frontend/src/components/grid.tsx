import React, { useEffect, useRef, useState } from 'react';
import useAuthStore from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Object{
    id:string;
    imageUrl:string;
    width:number; 
    height:number;
}
interface mapObject{
    elementID:string;
    x:number;
    y:number;
    imageUrl:string;
}
interface Cell {
  item: string | null; // Holds the item/image ID or null if empty
}
interface GridProps {
  rows: number; // Number of rows
  columns: number; // Number of columns
  draggedItem:Object|null;
  mapID:string;
  mapElements:mapObject[]|null;
}
const Grid: React.FC<GridProps> = ({ rows, columns,draggedItem,mapID, mapElements }) => {
  const token = useAuthStore((state) => state.token);
  const gridRef = useRef<HTMLDivElement>(null);
  const [, setScale] = useState<number>(1);
 const navigate=useNavigate();


  const zoomGrid = (factor: number) => {
    setScale((prevScale) => {
      const newScale = prevScale * factor;
      if (gridRef.current) {
        gridRef.current.style.transform = `scale(${newScale})`;
      }
      return newScale;
    });
  };
  
  const [grid, setGrid] = useState<Cell[][]>(
    Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => ({ item: null }))
    )
  );
  useEffect(()=>{
    console.log(grid)
    const newGrid= ()=>
    Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => ({ item: null }))
    )
    setGrid(newGrid)
  },[rows,columns]
  )
  useEffect(()=>{
    mapElements?.forEach(element=>{
      setGrid(prev=>{
        console.log(rows,columns,grid)
        const newGrid = [...prev]; // Copy the outer array
      console.log(newGrid)
      newGrid[element.x][element.y].item = element.imageUrl;
        
      
        return newGrid
      })
    })
   
  },[mapElements])


  async function handleClick(x:number,y:number){
    if(draggedItem!==null){
      console.log(draggedItem)
      console.log( mapID,
        draggedItem.id,
        x,
        y)
      const res=await fetch("http://localhost:3000/api/v1/admin/map/element",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "authorization":`Bearer ${token}`
        },
        body:JSON.stringify({
          mapID:mapID,
          elementID:draggedItem.id,
          x:x,
          y:y
        })
      }).then(res=>res.json())
      // grid[x][y].item=draggedItem.imageUrl;
      setGrid((prevGrid) => {
        const newGrid = [...prevGrid]; // Copy the outer array
        newGrid[x] = [...newGrid[x]]; // Copy the specific row
        newGrid[x][y].item = draggedItem!=null?draggedItem.imageUrl:null // Update the target cell
        return newGrid; // Return the updated grid
      });
      console.log(res)

      draggedItem=null;
    }
  }
  return (
    <div className="flex flex-col items-center">
      {/* Container for the grid */}
      <div className="w-[70vw] h-[60vh] overflow-auto  relative">
        <div
          className="grid  transform transition-transform duration-200 origin-top "
          ref={gridRef}
          
          style={{
            gridTemplateColumns: `repeat(${columns}, 100px)`,
            gridTemplateRows: `repeat(${rows}, 100px)`,
          }}
        >
            {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="border border-gray-300 bg-gray-100 relative"
              onClick={() => handleClick(rowIndex, colIndex)}
            >
              {/* Show the item in the cell, if any */}
              {cell && cell.item && (
                <div className="w-full h-full bg-green-500 text-white flex items-center justify-center">
                  <img src={cell.item} alt="logo" className="w-20 rounded-md" />
                </div>
              )}
            </div>
          ))
        )}
         
        </div>
      </div>

      {/* Zoom controls */}
      <div className="mt-4 space-x-2">
        <button
          onClick={() => zoomGrid(1.1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Zoom In
        </button>
        <button
          onClick={() => zoomGrid(0.9)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Zoom Out
        </button>
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onClick={()=>sessionStorage.clear()}>Reset</button>
          <button className='bg-blue-500 text-white p-2 rounded-md' onClick={()=>navigate('/')}>Save</button>
      </div>
    </div>
  );
};

export default Grid;
