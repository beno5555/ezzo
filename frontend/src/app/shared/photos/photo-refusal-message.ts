import { LIMITS } from '../../core/limits';
import { Dictionary } from '../../core/languages/dictionary';
import { PhotoRefusal } from './photo-refusal';
import { PhotoRefusalReason } from './photo-refusal-reason';
import { PhotoRules } from './photo-rules';

type RefusalTexts = Dictionary['shared']['photos']['refusals'];

// The sentence that tells the user which picked file was not added and why.
export function photoRefusalMessage(
  refusal: PhotoRefusal,
  rules: PhotoRules,
  texts: RefusalTexts,
): string {
  const messages: Record<PhotoRefusalReason, () => string> = {
    [PhotoRefusalReason.TooMany]: () => texts.tooMany(refusal.fileName, rules.maxCount),
    [PhotoRefusalReason.WrongType]: () => texts.wrongType(refusal.fileName),
    [PhotoRefusalReason.TooLarge]: () =>
      texts.tooLarge(refusal.fileName, rules.maxFileSizeBytes / LIMITS.images.bytesPerMegabyte),
  };

  return messages[refusal.reason]();
}
