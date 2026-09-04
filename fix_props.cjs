const fs = require('fs');
let file = fs.readFileSync('src/components/StudentProfileModal.tsx', 'utf-8');

file = file.replace(
  "  onUpdateProfile: (updatedProfile: { name: string; greekAlias: string; avatar: string }) => void;\n}",
  "  onUpdateProfile: (updatedProfile: { name: string; greekAlias: string; avatar: string }) => void;\n  onDelete: () => void;\n  onResetProgress: () => void;\n}"
);

fs.writeFileSync('src/components/StudentProfileModal.tsx', file);
