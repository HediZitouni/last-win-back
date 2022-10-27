import { Document, WithId } from "mongodb";

export interface LastMongo extends WithId<Document> {
  idUser: string;
  date: number;
}

export interface Last {
  idUser: string;
  date: number;
}
