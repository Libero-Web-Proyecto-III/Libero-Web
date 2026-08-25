export interface Publication {
  uuid: string;
  title: string;
  content: string;
  media: string;
  author: string;
  createdAt: Date;
  isVideo?: boolean;
}