import { PhotoCheck } from './photo-check';
import { PhotoRefusalReason } from './photo-refusal-reason';
import { PhotoRules } from './photo-rules';

// Sorts freshly picked files into those to add and those to refuse, before anything is uploaded. The
// backend checks again (it reads a file's leading bytes; the browser only knows the type the name
// suggests), so this only spares the user an upload that would be refused. `alreadyChosen` counts the
// photos picked earlier, so an eleventh photo is refused however many times the picker was opened.
export function checkPhotos(
  picked: readonly File[],
  alreadyChosen: number,
  rules: PhotoRules,
): PhotoCheck {
  const check: PhotoCheck = { accepted: [], refusals: [] };

  for (const file of picked) {
    const reason = refusalReasonOf(file, alreadyChosen + check.accepted.length, rules);
    const isAccepted = reason === null;

    if (isAccepted) {
      check.accepted.push(file);
    } else {
      check.refusals.push({ fileName: file.name, reason });
    }
  }

  return check;
}

// A wrong type is named before the count: removing a photo would not make that file acceptable.
function refusalReasonOf(
  file: File,
  chosenCount: number,
  rules: PhotoRules,
): PhotoRefusalReason | null {
  const isAcceptedType = rules.acceptedTypes.includes(file.type);
  const isSmallEnough = file.size <= rules.maxFileSizeBytes;
  const hasRoom = chosenCount < rules.maxCount;
  let reason: PhotoRefusalReason | null = null;

  if (!isAcceptedType) {
    reason = PhotoRefusalReason.WrongType;
  } else if (!isSmallEnough) {
    reason = PhotoRefusalReason.TooLarge;
  } else if (!hasRoom) {
    reason = PhotoRefusalReason.TooMany;
  }

  return reason;
}
