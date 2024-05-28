import express from "express";
import cookieParser from "cookie-parser";
import LogMiddleware from "./middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import UsersRouter from "./routes/users.router.js";
import CharactersRouter from "./routes/characters.router.js";
import ItemsRouter from "./routes/items.router.js";

import dotenv from 'dotenv';
dotenv.config(); 

const app = express();
const PORT = 3018;

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  return res.json({ message: "Hi! Welcome to my Game Simulator 2" });
});

app.use("/api", UsersRouter);
app.use("/api", CharactersRouter);
app.use("/api", ItemsRouter);

app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
