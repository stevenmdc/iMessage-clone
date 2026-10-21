const AVATAR_SIZE = 256;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function prepareAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choisissez un fichier image.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Choisissez une image de moins de 20 Mo.");

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); }
    catch { throw new Error("Image illisible. Essayez une photo JPEG, PNG ou WebP."); }
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) throw new Error("Cette image ne contient aucune photo lisible.");

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("La préparation des images est indisponible dans ce navigateur.");
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    return canvas.toDataURL("image/webp", .85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
