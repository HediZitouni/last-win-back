import { Document, WithId } from "mongodb";

interface Last extends WithId<Document> {
  id: string;
  idUser: string;
  date: number;
}

export { Last };
