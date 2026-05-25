import { RoomType } from "@prisma/client";
import type { Request, Response } from "express";
import { createRoomSchema } from "../modules/rooms/rooms.validators.js";
import { createRoom, joinRoom, leaveRoom, listVisibleRooms } from "../services/rooms.service.js";

export async function listRoomsController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const rooms = await listVisibleRooms(req.user.sub, req.user.role);
  return res.json(rooms);
}

export async function createRoomController(req: Request, res: Response) {
  try {
    const parsed = createRoomSchema.parse(req.body);
    if (parsed.type !== RoomType.restricted) {
      parsed.requiredRole = undefined;
    }

    const room = await createRoom(parsed);
    return res.status(201).json(room);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function joinRoomController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await joinRoom(req.params.roomId, req.user.sub);
  return res.status(204).send();
}

export async function leaveRoomController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await leaveRoom(req.params.roomId, req.user.sub);
  return res.status(204).send();
}
