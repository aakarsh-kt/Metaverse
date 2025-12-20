import { useSearchParams, useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";

interface SpaceElement {
  id: string;
  element: {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    static: boolean;
  };
  x: number;
  y: number;
}

interface GameObject {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  static: boolean;
}

interface Dimension {
  width: number;
  height: number;
}

const CreateSpace = () => {
  const token = useAuthStore((state) => state.token);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spaceID = searchParams.get('spaceID');

  // Space Data
  const [elements, setElements] = useState<SpaceElement[]>([]);
  const [availableObjects, setAvailableObjects] = useState<GameObject[]>([]);
  const [dimensions, setDimensions] = useState<Dimension>({ width: 0, height: 0 });
  const [selectedItem, setSelectedItem] = useState<GameObject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpace();
    getAvailableObjects();
  }, []);

  async function getAvailableObjects() {
    try {
      const res = await fetch("http://localhost:3000/api/v1/space/element/all", {
        method: "GET",
        headers: { "authorization": `Bearer ${token}` }
      }).then(res => res.json());
      setAvailableObjects(res.elements || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function getSpace() {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/space/${spaceID}`, {
        method: "GET",
        headers: {
          "authorization": `Bearer ${token}`
        }
      }).then(res => res.json());

      setElements(res.elements || []);
      if (res.dimensions) {
        const [w, h] = res.dimensions.split("x").map(Number);
        setDimensions({ width: w, height: h });
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddElement(x: number, y: number, item: GameObject | null = selectedItem) {
    if (!item || !spaceID) return;

    try {
      const res = await fetch("http://localhost:3000/api/v1/space/element", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          elementID: item.id,
          spaceID: spaceID,
          x: x,
          y: y
        })
      });

      if (res.ok) {
        getSpace();
        setSelectedItem(null);
      } else {
        console.error("Failed to add element");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteElement(id: string) {
    try {
      const res = await fetch("http://localhost:3000/api/v1/space/element", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          elementID: id
        })
      });
      if (res.ok) getSpace();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleStatic(spaceElementID: string, nextStatic: boolean) {
    try {
      const res = await fetch("http://localhost:3000/api/v1/space/element/static", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          spaceElementID,
          static: nextStatic,
        })
      });
      if (res.ok) {
        getSpace();
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j?.message ?? "Failed to update element");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleJoin = () => {
    navigate(`/lounge?spaceId=${spaceID}`);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: GameObject) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    setSelectedItem(item); // Also select it for click-to-place visual feedback
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Essential to allow dropping
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      const item = JSON.parse(data) as GameObject;
      handleAddElement(x, y, item);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100 font-sans pt-16">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">

        {/* Main Workspace (Left) */}
        <div className="flex-1 relative bg-gray-950 flex flex-col min-w-0">
          {/* Header Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
            <div className="bg-gray-900/80 backdrop-blur pointer-events-auto border border-gray-800 px-4 py-2 rounded-full shadow-lg">
              <span className="text-gray-400 text-sm">Space ID: </span>
              <span className="font-mono text-blue-400 font-medium">{spaceID}</span>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}
              className="pointer-events-auto bg-gray-900/80 backdrop-blur border border-gray-800 hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg"
            >
              Share Link
            </button>
          </div>

          {/* Interactive Grid */}
          <div className="flex-1 overflow-auto p-12 flex bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-gray-950 custom-scrollbar">
            {loading ? (
              <div className="m-auto flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500 font-medium">Loading Universe...</span>
              </div>
            ) : (
              <div className="m-auto relative shadow-2xl shadow-blue-900/20 border border-gray-800 rounded-lg overflow-hidden ring-1 ring-white/5 bg-gray-900/90 backdrop-blur-md">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${dimensions.width}, 40px)`,
                    gridTemplateRows: `repeat(${dimensions.height}, 40px)`,
                  }}
                >
                  {Array.from({ length: dimensions.height * dimensions.width }).map((_, i) => {
                    const x = i % dimensions.width;
                    const y = Math.floor(i / dimensions.width);
                    const existingElement = elements.find(e => e.x === x && e.y === y);

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`
                                                    border border-white/[0.05] w-10 h-10 flex items-center justify-center relative group
                                                    ${existingElement ? "" : "hover:bg-blue-500/20 transition-colors"}
                                                `}
                        onClick={() => {
                          if (existingElement) {
                            if (window.confirm("Delete this element?")) {
                              handleDeleteElement(existingElement.id);
                            }
                          } else {
                            handleAddElement(x, y);
                          }
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, x, y)}
                      >
                        {/* Render Element */}
                        {existingElement && (
                          <div className="relative w-full h-full group/item">
                            <img
                              src={existingElement.element.imageUrl}
                              alt="placed-obj"
                              className="w-full h-full object-contain p-0.5 select-none pointer-events-none"
                            />
                            <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-1 p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatic(existingElement.id, !existingElement.element.static);
                                }}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${existingElement.element.static ? "bg-green-600/20 border-green-600/40 text-green-300" : "bg-gray-800/60 border-gray-700 text-gray-200"}`}
                                title={existingElement.element.static ? "Collision ON (blocking)" : "Collision OFF (walkable)"}
                              >
                                {existingElement.element.static ? "Blocking" : "Walkable"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Ghost Preview (Click Mode) */}
                        {!existingElement && selectedItem && (
                          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center opacity-40 pointer-events-none">
                            <img src={selectedItem.imageUrl} className="w-full h-full object-contain filter grayscale" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
          <div className="p-5 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Space Constructor
            </h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              <span className="text-blue-400 font-semibold">Drag & Drop</span> items or <span className="text-blue-400 font-semibold">Select & Click</span> to place them.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900/30">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 pl-1">Furniture & Assets</h3>
            <div className="grid grid-cols-2 gap-3">
              {availableObjects.map((o) => (
                <div
                  key={o.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, o)}
                  className={`
                                        cursor-grab active:cursor-grabbing p-3 rounded-xl border transition-all group relative
                                        ${selectedItem?.id === o.id
                      ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"}
                                    `}
                  onClick={() => setSelectedItem(o)}
                >
                  <div className="aspect-square flex items-center justify-center bg-gray-950/50 rounded-lg mb-3 p-2 group-hover:bg-gray-950 transition-colors">
                    <img src={o.imageUrl} alt="asset" className="w-full h-full object-contain drop-shadow-md select-none" />
                  </div>
                  <div className="text-xs font-medium text-gray-300 text-center truncate">{o.width}x{o.height}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-t border-gray-800 bg-gray-900">
            <button
              onClick={handleJoin}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Enter Space
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateSpace;