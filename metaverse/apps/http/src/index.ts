import express from "express";
import { router } from "./routes/v1";
import cors from "cors";
const corsOptions = {
    origin: "http://localhost:5173", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Adjust based on headers used
    credentials: true, // Allow credentials if needed
  };
const app=express();
app.use(express.json())
app.use(cors(corsOptions));
app.use("/api/v1",router);


app.listen(3000,()=>{
    console.log("Server is listening on PORT 3000");
});
