import * as fs from "fs";
import * as path from "path";
const EXTENSION = ".md";
const removeMdExtension = (name) => {
    return name.substring(0, name.length - EXTENSION.length);
};
const readNotesPaths = async (noteFolderPath) => {
    const noteDirectoryEntries = await fs.promises.readdir(noteFolderPath, {
        withFileTypes: true
    });
    const firstLevelNotes = noteDirectoryEntries
        .filter(entry => entry.isFile()
        && !entry.name.startsWith(".")
        && entry.name.endsWith(EXTENSION))
        .map(entry => ({
        title: removeMdExtension(entry.name).toLowerCase(),
        path: path.join(noteFolderPath, entry.name),
        referenced_by: [],
    }));
    const foldersPaths = noteDirectoryEntries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(noteFolderPath, entry.name));
    const nestedNotesPaths = await Promise.all(foldersPaths.map(async (folderPath) => readNotesPaths(folderPath)));
    nestedNotesPaths.push(firstLevelNotes);
    return nestedNotesPaths.flat();
};
const duplicateId = (note, vaultDir) => removeMdExtension(note.path).substring(vaultDir.length + 1).toLowerCase();
const buildNotesIndexFromArray = (notes, vaultDir) => {
    const index = {};
    for (const note of notes) {
        if (!index[note.title]) {
            index[note.title] = note;
        }
        else {
            const noteId = duplicateId(note, vaultDir);
            index[noteId] = note;
            if (Array.isArray(index[note.title])) {
                index[note.title].push(noteId);
            }
            else {
                const duplicateNote = index[note.title];
                const duplicateNoteId = duplicateId(duplicateNote, vaultDir);
                index[duplicateNoteId] = index[note.title];
                index[note.title] = [duplicateNoteId, noteId];
            }
        }
    }
    return index;
};
export default async function getAllNotesInVault(vaultDir) {
    const flattenNotesInVault = await readNotesPaths(vaultDir);
    return buildNotesIndexFromArray(flattenNotesInVault, vaultDir);
}
//# sourceMappingURL=getAllNotesInVault.js.map