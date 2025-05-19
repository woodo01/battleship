import { httpServer } from "./http_server";
import { config } from "dotenv";
import { WSServer } from "./web_socket/server";

config();
const HTTP_PORT: number = Number(process.env.HTTP_PORT) || 8181;
httpServer.listen(HTTP_PORT, () => console.log(`Start static http server on the ${HTTP_PORT} port!`));

const SOCKET_PORT = process.env.SOCKET_PORT || 3000;
(new WSServer()).startServer(Number(SOCKET_PORT));
