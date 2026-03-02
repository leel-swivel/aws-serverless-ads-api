export interface CreateAdServiceInput {
  title: string;
  price: number;
  imageBase64?: string;
  userId: string;
}

export interface AdEntity {
  id: string;
  title: string;
  price: number;
  imageKey?: string;
  userId: string;
  createdAt: string;
}

export interface AdImageDto {
  key: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface AdResponse {
  id: string;
  title: string;
  price: number;
  userId: string;
  createdAt: string;
  image?: AdImageDto;
}
