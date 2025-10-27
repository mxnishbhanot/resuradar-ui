export interface Resume {
  _id?: string;
  filename: string;
  text?: string;
  analysis?: any; // store structured object or raw string
  score?: number;
  createdAt?: string;
}
