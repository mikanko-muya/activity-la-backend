import express from "express"
import cors from "cors";
import router from "./router/routers.js";
import { PORT } from "./config/globalkey.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { NotFoundError } from "./utils/errors/index.js";

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/api', router);

// FIX: an unknown path fell through to Express's default HTML error page, so
// clients got HTML instead of the { success, message } shape every other
// response uses. Must sit after the routes and before errorHandler.
app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

app.use(errorHandler)

app.listen(PORT, ()=>{
    console.log(`http://localhost:${PORT}`);
})
