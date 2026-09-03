import express from "express"
import cors from "cors";
import router from "./router/routers.js";
import { PORT } from "./config/globalkey.js";

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/api', router);

app.listen(PORT, ()=>{
    console.log(`http://localhost:${PORT}`);
})