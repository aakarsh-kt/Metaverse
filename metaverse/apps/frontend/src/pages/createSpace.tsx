import {  useSearchParams } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";

interface Object{
    id: string;
    element: {
        id: string
        imageUrl:string
        width: string
        height: string
        // static: e.element.static
    },
    x: number
    y: number
}
interface Dimension{
    width:number;
    height:number;
}interface Cell {
    item: string | null; // Holds the item/image ID or null if empty
  }
const CreateSpace =() => {
   const token = useAuthStore((state) => state.token);
   const [searchParams] = useSearchParams();
   const spaceID = searchParams.get('spaceID');
    const [elements,setElements]=React.useState<Object[]>([]);
    const [dimensions,setDimensions]=React.useState<Dimension>({width:0,height:0});
    async function getSpace(){
        const res=await fetch(`http://localhost:3000/api/v1/space/${spaceID}`,{
            method:"GET",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            }
        }).then(res=>res.json())
        console.log(res)
        console.log(spaceID)
        setElements(res.elements);
        setDimensions({width:parseInt(res.dimensions.split("x")[0]),height:parseInt(res.dimensions.split("x")[1])});    
        console.log(dimensions)
    }
    useEffect(()=>{
        getSpace();
    },[])
    const [grid, setGrid] = useState<Cell[][]>(
        Array.from({ length: dimensions.height }, () =>
          Array.from({ length: dimensions.width }, () => ({ item: null }))
        )
      );
      useEffect(()=>{
        console.log(grid)
        const newGrid= ()=>
        Array.from({ length: dimensions.height }, () =>
          Array.from({ length: dimensions.width }, () => ({ item: null }))
        )
        setGrid(newGrid)
      },[dimensions.height,dimensions.width]
      )
      useEffect(()=>{
        elements?.forEach(element=>{
          setGrid(prev=>{
            console.log(dimensions.height,dimensions.width,grid)
            const newGrid = [...prev]; // Copy the outer array
          console.log(newGrid)
          newGrid[element.x][element.y].item = element.element.imageUrl;
            
          
            return newGrid
          })
        })
       
      },[elements])
    return (
        <div className="flex flex-col items-center justify-center">
           <Navbar />
            <h1>Create Space With Map</h1>
           
            <div className="w-[70vw] h-[60vh] overflow-auto  relative">
        <div
          className="grid  transform transition-transform duration-200 origin-top "
        //   ref={gridRef}
          
          style={{
            gridTemplateColumns: `repeat(${dimensions.height}, 100px)`,
            gridTemplateRows: `repeat(${dimensions.width}, 100px)`,
          }}
        >
            {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="border border-gray-300 bg-gray-100 relative"
            //   onClick={() => handleClick(rowIndex, colIndex)}
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
        </div>
    );
};

export default CreateSpace;