import { NextFunction, Request, Response } from "express";

export function logCalls(req: Request, res: Response, next: NextFunction) {
  console.log(
    `[${req.method}] '${req.originalUrl}'
        BODY:\ ${JSON.stringify(req.body) || "null"}
        QUERY: ${JSON.stringify(req.query) || "null"}`
  );
  next();
}
