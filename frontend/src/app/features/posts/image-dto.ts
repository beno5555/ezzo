// The backend's ImageDto (Infrastructure/Dtos/Images/ImageDto.cs): one photo of a post or a message.
// address is relative (/api/images/{name}), and orderIndex is its place in upload order.
export type ImageDto = {
  id: number;
  address: string;
  orderIndex: number;
};
