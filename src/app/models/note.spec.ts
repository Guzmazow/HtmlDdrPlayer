import { NoteType } from './enums';
import { Note } from './note';

describe('Note', () => {
  it('should create an instance', () => {
    expect(new Note(NoteType.NONE, 0)).toBeTruthy();
  });
});
