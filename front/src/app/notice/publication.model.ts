export type MediaType = 'image' | 'video';

export interface PublicationMedia {
  url: string;
  type: MediaType;
  /* Solo aplica para videos: imagen de portada mientras no se reproduce */
  poster?: string;
}

export type ReactionType = 'like' | 'dislike';

export interface Comment {
  uuid: string;
  author: string;
  content: string;
  createdAt: Date;
  likes: number;
  dislikes: number;
  userReaction: ReactionType | null;
}

export interface Publication {
  uuid: string;
  title: string;
  content: string;
  media: PublicationMedia[];
  author: string;
  createdAt: Date;
  likes: number;
  dislikes: number;
  userReaction: ReactionType | null;
  comments: Comment[];
}