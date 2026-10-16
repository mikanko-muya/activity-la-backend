import express from "express"
import cors from "cors";
import router from "./router/routers.js";
import { PORT } from "./config/globalkey.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { NotFoundError } from "./utils/errors/index.js";
import { startPhajayListener } from "./module/payment/phajay.listener.js";

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
// One versioned mount. A breaking change ships as /api/v2 beside it, so a
// client that cannot be updated in step - a mobile build already on phones -
// keeps working on v1.
app.use("/api/v1", router);

app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

app.use(errorHandler)

app.listen(PORT, ()=>{
    console.log(`http://localhost:${PORT}`);
    // One connection for the whole API, opened once it is serving: completed
    // QR payments arrive here and are settled in the background.
    startPhajayListener();
})
