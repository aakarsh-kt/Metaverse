
export default function Advertisement() {
   
    return (
       <div className="flex flex-col justify-center items-center bg-slate-600 h-full p-2">
           <h1 className="text-6xl text-white font-bold  ">Why Link Lounge!</h1>
          <div className="flex flex-row justify-between  items-center">
            <div>
              <h1 className="text-2xl text-white font-bold mb-10">
                  Link Lounge is a place where you can link your workplace with your friends and colleagues. It is a place where you can share your workplace and collaborate with your colleagues.
              </h1>
              <h1 className="text-2xl text-white font-bold">
                  Link Lounge is a place where you can link your workplace with your friends and colleagues. It is a place where you can share your workplace and collaborate with your colleagues.
              </h1>
            </div>
            <div className="flex flex-col items-center justify-center max-h-full">
                <img src="/assets/advertisement.jpg" alt="logo" className="w-2/5 rounded-full " />
            </div>
          </div>
       </div>
    )
}