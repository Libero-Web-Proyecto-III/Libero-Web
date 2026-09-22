export type MediaType = 'image' | 'video';

export interface PublicationMedia {
  url: string;
  type: MediaType;
  poster?: string;
  embedUrl?: string;
}

export type ReactionType = 'like' | 'dislike';

export interface Comment {
  uuid: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  dislikes: number;
  userReaction: ReactionType | null;
}

export interface Category {
  uuid: string;
  name: string;
  color: string;
  icon: string;
}

export interface Publication {
  uuid: string;
  title: string;
  content: string;
  media: PublicationMedia[];
  author: string;
  category: Category | null;
  createdAt: Date;
  likes: number;
  dislikes: number;
  userReaction: ReactionType | null;
  comments: Comment[];
}