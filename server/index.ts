import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"],
    },
});

interface Player {
    id: string;
    roomId: string;
}

const players: Record<string, Player> = {};
const rooms: Record<string, string[]> = {}; // roomId -> playerIds[]

io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinGame", () => {
        // Simple matchmaking: Find first room with < 2 players
        let roomId: string | undefined = Object.keys(rooms).find((id) => rooms[id].length < 2);

        if (!roomId) {
            roomId = uuidv4();
            rooms[roomId] = [];
        }

        rooms[roomId].push(socket.id);
        players[socket.id] = { id: socket.id, roomId: roomId };
        socket.join(roomId);

        console.log(`User ${socket.id} joined room ${roomId}`);

        const playerIndex = rooms[roomId].indexOf(socket.id); // 0 or 1
        // Tell the client which player they are (left=0 or right=1)
        socket.emit("playerAssigned", { playerIndex: playerIndex });

        if (rooms[roomId].length === 2) {
            io.to(roomId).emit("gameStart");
            console.log(`Room ${roomId} game starting`);
        } else {
            socket.emit("waitingForOpponent");
        }
    });

    socket.on("paddleMove", (data: { y: number }) => {
        const player = players[socket.id];
        if (player && player.roomId) {
            // Broadcast to other players in the room (specifically the opponent)
            socket.to(player.roomId).emit("opponentMove", data);
        }
    });

    socket.on("ballUpdate", (data: { x: number, y: number, vx: number, vy: number }) => {
        // We only want ONE client (e.g. player 0) to be authoritative for ball physics
        // OR we relay ball state. For now, let's assume Client 0 drives physics and sends updates.
        const player = players[socket.id];
        if (player && player.roomId) {
            socket.to(player.roomId).emit("ballUpdate", data);
        }
    });

    socket.on("scoreUpdate", (data: { left: number, right: number }) => {
        const player = players[socket.id];
        if (player && player.roomId) {
            io.to(player.roomId).emit("scoreUpdate", data);
        }
    });


    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        const player = players[socket.id];
        if (player) {
            const roomId = player.roomId;
            if (rooms[roomId]) {
                rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
                io.to(roomId).emit("opponentDisconnected");

                if (rooms[roomId].length === 0) {
                    delete rooms[roomId];
                }
            }
            delete players[socket.id];
        }
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
