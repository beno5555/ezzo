import { ImageDto } from '../../features/posts/image-dto';

// The photos in the order they were uploaded, which is the order they are shown in.
export function inUploadOrder(images: readonly ImageDto[]): ImageDto[] {
  return [...images].sort((first, second) => first.orderIndex - second.orderIndex);
}
